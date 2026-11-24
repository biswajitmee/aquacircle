import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/server/database";
import { mailConfigurationReady } from "@/lib/server/email";
import { usesNetlifyForms } from "@/lib/enquiry-submission";
export const dynamic = "force-dynamic";
export async function GET() {
  if (usesNetlifyForms) {
    return NextResponse.json(
      {
        status: "managed_by_netlify",
        provider: "netlify-forms",
        notifications: "verify_in_netlify_dashboard",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    await (await getDatabase()).query("SELECT 1");
    const ready =
      mailConfigurationReady() &&
      !!(
        process.env.RATE_LIMIT_SECRET || process.env.LOCAL_DEVELOPMENT === "1"
      );
    return NextResponse.json(
      { status: ready ? "ready" : "not_ready" },
      { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "not_ready" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
