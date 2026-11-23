import { describe, it, expect } from "vitest";
import { enquirySchema, pinSchema } from "@/lib/validation";
const valid = {
  name: "Test Customer",
  mobile: "9876543210",
  pin: "700001",
  service: "routine",
  consent: true,
  source: "hero",
};
describe("Enquiry validation", () => {
  it("accepts the minimal request without a model", () =>
    expect(enquirySchema.safeParse(valid).success).toBe(true));
  it.each(["1234567890", "98765", "+15551234567", "98765432100"])(
    "rejects invalid mobile %s",
    (mobile) =>
      expect(enquirySchema.safeParse({ ...valid, mobile }).success).toBe(false),
  );
  it.each(["9876543210", "+919876543210", "+91 9876543210"])(
    "accepts Indian mobile %s",
    (mobile) =>
      expect(enquirySchema.safeParse({ ...valid, mobile }).success).toBe(true),
  );
  it.each(["000000", "70000", "7000000", "ABCDEF"])(
    "rejects invalid PIN %s",
    (pin) => expect(pinSchema.safeParse(pin).success).toBe(false),
  );
  it("requires consent", () =>
    expect(enquirySchema.safeParse({ ...valid, consent: false }).success).toBe(
      false,
    ));
  it("rejects unknown services and unexpected fields", () => {
    expect(
      enquirySchema.safeParse({ ...valid, service: "dishwasher" }).success,
    ).toBe(false);
    expect(enquirySchema.safeParse({ ...valid, admin: true }).success).toBe(
      false,
    );
  });
  it("rejects oversized descriptions and malformed email", () => {
    expect(
      enquirySchema.safeParse({ ...valid, problem: "x".repeat(2001) }).success,
    ).toBe(false);
    expect(
      enquirySchema.safeParse({
        ...valid,
        email: "bad\r\nBcc: someone@example.com",
      }).success,
    ).toBe(false);
  });
  it("rejects past, impossible and distant requested dates", () => {
    for (const preferredDate of ["2000-01-01", "2099-02-31", "2099-01-01"])
      expect(enquirySchema.safeParse({ ...valid, preferredDate }).success).toBe(
        false,
      );
  });
});
