import { createHmac, randomUUID } from "node:crypto";
import { NextResponse, after } from "next/server";
import { enquirySchema } from "@/lib/validation";
import { getDatabase, consumeLimit } from "@/lib/server/database";
import {
  saveEnquiry,
  deliverEnquiry,
  DuplicateConflict,
} from "@/lib/server/enquiries";
import { mailConfigurationReady } from "@/lib/server/email";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 16_384;
function failure(
  error: string,
  status: number,
  headers?: Record<string, string>,
) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store", ...headers } },
  );
}
async function limitedBody(request: Request) {
  if (Number(request.headers.get("content-length")) > MAX_BYTES)
    throw new RangeError();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError();
  let size = 0;
  const parts: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      throw new RangeError();
    }
    parts.push(value);
  }
  return JSON.parse(Buffer.concat(parts).toString("utf8"));
}
export async function POST(request: Request) {
  const expected = process.env.SITE_URL || "https://aquacircle.in";
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(expected).origin)
    return failure("This request origin is not allowed.", 403);
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return failure("This request origin is not allowed.", 403);
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    return failure("Send the request as JSON.", 415);
  let raw: unknown;
  try {
    raw = await limitedBody(request);
  } catch (error) {
    return failure(
      error instanceof RangeError
        ? "The request is too large."
        : "The request could not be read.",
      error instanceof RangeError ? 413 : 400,
    );
  }
  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success)
    return failure("Please check your details and try again.", 422);
  if (parsed.data.website)
    return failure("This request could not be accepted.", 400);
  if (!mailConfigurationReady())
    return failure(
      "Online requests are temporarily unavailable. Please try again shortly.",
      503,
    );
  const secret =
    process.env.RATE_LIMIT_SECRET ||
    (process.env.LOCAL_DEVELOPMENT === "1" ? "local-development-only" : "");
  if (!secret)
    return failure(
      "Online requests are temporarily unavailable. Please try again shortly.",
      503,
    );
  const suppliedKey = request.headers.get("idempotency-key");
  if (
    suppliedKey &&
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
      suppliedKey,
    )
  )
    return failure("Invalid request identifier. Please reload the form.", 400);
  try {
    const db = await getDatabase();
    const client =
      process.env.TRUST_PROXY === "true"
        ? request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
          "unknown"
        : "shared";
    const hash = (v: string) =>
      createHmac("sha256", secret).update(v).digest("hex");
    const mobile = parsed.data.mobile.replace(/\D/g, "").slice(-10);
    const allowed = await consumeLimit(
      db,
      `client:${hash(client)}`,
      client === "shared" ? 100 : 12,
      900,
    );
    const phoneAllowed =
      allowed && (await consumeLimit(db, `mobile:${hash(mobile)}`, 5, 3600));
    if (!phoneAllowed)
      return failure(
        "Too many requests. Please wait before trying again.",
        429,
        { "Retry-After": "900" },
      );
    const { record, duplicate } = await saveEnquiry(
      db,
      { ...parsed.data, mobile },
      suppliedKey || randomUUID(),
    );
    // Durable acceptance first. The post-response hook attempts SMTP; worker recovers interruptions.
    after(async () => {
      try {
        await deliverEnquiry(db, record.id);
      } catch {
        console.error("enquiry_delivery_deferred", record.reference);
      }
    });
    return NextResponse.json(
      {
        reference: record.reference,
        status: "received",
        notification: record.status === "EMAIL_SENT" ? "sent" : "pending",
        duplicate,
      },
      {
        status: duplicate ? 200 : 202,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    if (error instanceof DuplicateConflict)
      return failure(
        "This request identifier was already used. Please reload the form.",
        409,
      );
    console.error("enquiry_storage_unavailable");
    return failure(
      "We could not save your request. Please try again shortly.",
      503,
    );
  }
}
