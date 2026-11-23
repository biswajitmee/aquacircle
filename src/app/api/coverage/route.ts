import { NextResponse } from "next/server";
import { pinSchema } from "@/lib/validation";
import { business } from "@/config/business";

export function GET(request: Request) {
  const pin = new URL(request.url).searchParams.get("pin") || "";

  if (!pinSchema.safeParse(pin).success) {
    return NextResponse.json(
      { error: "Enter a valid six-digit Indian PIN code." },
      { status: 422 },
    );
  }

  const area = business.areas.find((entry) => entry.pins.includes(pin));

  return NextResponse.json(
    {
      status: area ? "listed" : "confirmation_required",
      message: area
        ? `${area.name} is in our listed service area. Send a request so we can confirm availability for your address.`
        : "Availability for this PIN requires confirmation. Send an enquiry and we’ll check your address.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
