import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/server/database";
import { mailConfigurationReady } from "@/lib/server/email";
export const dynamic = "force-dynamic";
export async function GET() {
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
