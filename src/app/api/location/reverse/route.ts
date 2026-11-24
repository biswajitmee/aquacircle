import { coordinatesSchema } from "@/lib/service-location";
import { reverseGeocode } from "@/lib/server/reverse-geocoding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
let nextLookupAt = 0;
const reply = (address: string | null, status = 200) => Response.json(
  { address, provider: address ? "geoapify" : null },
  { status, headers: { "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex" } },
);

export async function POST(request: Request) {
  const origin = new URL(process.env.SITE_URL || "https://aquacircle.in").origin;
  if (request.headers.get("origin") !== origin || request.headers.get("sec-fetch-site") === "cross-site") return reply(null, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return reply(null, 415);
  if (new URL(request.url).search) return reply(null, 400);
  const reader = request.body?.getReader();
  if (!reader) return reply(null, 400);
  let size = 0;
  const parts: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 512) { await reader.cancel(); return reply(null, 413); }
      parts.push(value);
    }
    const result = coordinatesSchema.safeParse(JSON.parse(Buffer.concat(parts).toString("utf8")));
    if (!result.success) return reply(null, 422);
    if (!process.env.GEOAPIFY_API_KEY) return reply(null);
    // Best-effort per-instance throttle; provider account quotas remain authoritative.
    if (Date.now() < nextLookupAt) return reply(null, 429);
    nextLookupAt = Date.now() + 1000;
    const address = await reverseGeocode(result.data.latitude, result.data.longitude);
    return reply(address);
  } catch {
    return reply(null, 400);
  }
}
