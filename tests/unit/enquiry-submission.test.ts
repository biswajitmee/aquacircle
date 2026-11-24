import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  NETLIFY_FORM_NAME,
  SUBMISSION_ERROR,
  netlifyFormData,
  serviceRequestSubject,
  submitEnquiry,
} from "@/lib/enquiry-submission";
import type { EnquiryInput } from "@/lib/validation";

const values: EnquiryInput = {
  name: "QA Customer & Family",
  mobile: "+91 9000000000",
  pin: "700001",
  service: "routine",
  email: "qa@example.test",
  brand: "QA Brand",
  model: "Model + 1",
  address: "QA service address, floor 2",
  preferredDate: "2026-11-25",
  preferredTime: "morning",
  problem: "QA only: low flow & a leak.\nPlease check the filter + connection.",
  consent: true,
  source: "service-card",
  website: "",
};
const id = "12345678-1234-4123-8123-123456789abc";
const at = new Date("2026-11-24T09:30:00Z");

afterEach(() => vi.unstubAllGlobals());

describe("Netlify Forms transport", () => {
  it("preserves every existing field and encodes special characters losslessly", () => {
    const body = new URLSearchParams(netlifyFormData(values, id, at).toString());
    for (const field of ["name", "mobile", "pin", "service", "email", "brand", "model", "address", "preferredDate", "preferredTime", "problem", "website"] as const) {
      expect(body.get(field)).toBe(values[field]);
    }
    expect(body.get("consent")).toBe("Agreed to be contacted about this request");
    expect(body.get("sourceLocation")).toBe(values.source);
    expect(body.get("source")).toBe("AquaCircle.in Website");
    expect(body.get("submittedAt")).toBe(at.toISOString());
    expect(body.get("submissionDate")).toMatch(/3:00:00\s*pm/);
    expect(body.get("submissionDate")).toContain("IST");
    expect(body.get("subject")).toBe("New AquaCircle Service Request — QA Customer & Family — Routine service & cleaning");
  });

  it("registers every submitted field in the deploy-time static definition", () => {
    const html = readFileSync("public/__forms.html", "utf8");
    expect(html).toContain(`name="${NETLIFY_FORM_NAME}"`);
    expect(html).toContain('data-netlify="true"');
    expect(html).toContain('data-netlify-honeypot="website"');
    const fields = [...html.matchAll(/<(?:input|textarea)\b[^>]*\bname="([^"]+)"/g)].map(match => match[1]);
    expect(new Set(fields)).toEqual(new Set(netlifyFormData(values, id, at).keys()));
  });

  it("accepts Netlify's successful HTML response without expecting JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("<html>Thank you</html>", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const reference = await submitEnquiry(values, id, at, new AbortController().signal, "netlify");
    expect(reference).toBe("AC-2026-123456781234");
    expect(fetchMock.mock.calls[0][0]).toBe("/__forms.html");
    expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
  });

  it.each([400, 403, 404, 405, 422, 429, 500, 503])("never confirms receipt for HTTP %s", async status => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Unavailable", { status })));
    await expect(submitEnquiry(values, id, at, new AbortController().signal, "netlify")).rejects.toThrow(SUBMISSION_ERROR);
  });

  it("does not treat a network failure as receipt", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(submitEnquiry(values, id, at, new AbortController().signal, "netlify")).rejects.toThrow();
  });

  it("requires a real reference from the existing API", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: "received" })));
    await expect(submitEnquiry(values, id, at, new AbortController().signal, "api")).rejects.toThrow(SUBMISSION_ERROR);
  });

  it("keeps the API idempotency key and original validated payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ reference: "AC-2026-ABCDEF123456" }, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(submitEnquiry(values, id, at, new AbortController().signal, "api")).resolves.toBe("AC-2026-ABCDEF123456");
    expect(fetchMock.mock.calls[0][1].headers["Idempotency-Key"]).toBe(id);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(values);
  });

  it("keeps notification subjects on one line", () => {
    expect(serviceRequestSubject("QA\r\nName", "routine")).not.toMatch(/[\r\n]/);
  });
});
