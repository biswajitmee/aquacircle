import { afterEach, describe, expect, it, vi } from "vitest";
import { enquirySchema, type EnquiryInput } from "@/lib/validation";
import { locationFields, mapsLink, type CapturedLocation } from "@/lib/service-location";
import { netlifyFormData } from "@/lib/enquiry-submission";
import { emailContent } from "@/lib/server/email";
import { reverseGeocode } from "@/lib/server/reverse-geocoding";
import { POST } from "@/app/api/location/reverse/route";

// Synthetic public test position, never a customer or tester's real location.
const location: CapturedLocation = { source: "browser", address: "QA public test point, Kolkata", latitude: 22.572645123456, longitude: 88.363892123456, accuracy: 18.25, pin: "700001", confirmed: true };
const enquiry: EnquiryInput = { name: "QA Location", mobile: "9000000000", pin: "700001", service: "routine", consent: true, source: "hero" };
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("optional service location", () => {
  it("keeps location optional and does not invent a Maps destination", () => {
    expect(enquirySchema.safeParse(enquiry).success).toBe(true);
    expect(enquirySchema.safeParse({ ...enquiry, location: null }).success).toBe(true);
    expect(locationFields(enquiry)).toMatchObject({ serviceLocation: "Location not shared", latitude: "", longitude: "", googleMaps: "" });
  });
  it("preserves GPS precision, accuracy and the confirmed destination", () => {
    const fields = locationFields({ ...enquiry, location });
    expect(fields.latitude).toBe(String(location.latitude));
    expect(fields.locationAccuracy).toBe("18.25 metres");
    const url = new URL(fields.googleMaps);
    expect(url.origin + url.pathname).toBe("https://www.google.com/maps/dir/");
    expect(url.searchParams.get("destination")).toBe(`${location.latitude},${location.longitude}`);
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.has("origin")).toBe(false);
    expect(fields.googleMaps).toContain("%2C");
  });
  it("treats zero coordinates as real values", () => {
    const fields = locationFields({ ...enquiry, location: { ...location, latitude: 0, longitude: 0, accuracy: 0 } });
    expect(fields.latitude).toBe("0");
    expect(fields.googleMaps).toContain("destination=0%2C0");
  });
  it("encodes manual Unicode addresses safely without inventing GPS", () => {
    const address = "QA কলকাতা, Block A & B / floor #2";
    const fields = locationFields({ ...enquiry, location: { source: "manual", address } });
    expect(new URL(fields.googleMaps).searchParams.get("query")).toBe(address);
    expect(fields.googleMaps).toContain("/maps/search/");
    expect(fields.latitude).toBe("");
    expect(fields.locationSource).toBe("Manually Entered");
  });
  it("preserves the original address field as a manual fallback", () => {
    expect(new URL(locationFields({ ...enquiry, address: "QA legacy address" }).googleMaps).searchParams.get("query")).toBe("QA legacy address");
  });
  it("rejects unconfirmed GPS and a location bound to a different PIN", () => {
    expect(enquirySchema.safeParse({ ...enquiry, location: { ...location, confirmed: false } }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...enquiry, pin: "700002", location }).success).toBe(false);
    expect(locationFields({ ...enquiry, pin: "700002", location }).googleMaps).toBe("");
  });
  it.each([{ latitude: 91 }, { latitude: -91 }, { longitude: 181 }, { longitude: -181 }, { accuracy: -1 }, { latitude: Infinity }, { longitude: NaN }])("rejects invalid position data %j", invalid => {
    expect(enquirySchema.safeParse({ ...enquiry, location: { ...location, ...invalid } }).success).toBe(false);
  });
  it("adds every location value to the existing Netlify payload", () => {
    const fields = netlifyFormData({ ...enquiry, location }, "12345678-1234-4123-8123-123456789abc", new Date());
    expect(fields.get("latitude")).toBe(String(location.latitude));
    expect(fields.get("longitude")).toBe(String(location.longitude));
    expect(fields.get("serviceLocation")).toBe(location.address);
    expect(fields.get("googleMaps")).toBe(mapsLink(location));
    expect(fields.get("serviceLocationDetails")).toContain("SERVICE LOCATION DETAILS");
    expect(fields.get("serviceLocationDetails")).toContain(`Google Maps:\n${mapsLink(location)}`);
  });
  it("extends SMTP text and HTML safely without replacing existing details", () => {
    const email = emailContent("AC-QA", { ...enquiry, location: { ...location, address: "QA <script>address</script>", geocoded: true } }, new Date());
    expect(email.text).toContain(`GPS Latitude: ${location.latitude}`);
    expect(email.text).toContain("Location Accuracy: 18.25 metres");
    expect(email.text).toContain("Location Source: Browser Geolocation");
    expect(email.text).toContain("Geoapify");
    expect(email.html).toContain("OPEN CUSTOMER LOCATION IN GOOGLE MAPS");
    expect(email.html).not.toContain("<script>");
    expect(email.text).toContain("Mobile: 9000000000");
    expect(email.text).toContain("Contact consent: Agreed");
  });
});

describe("private reverse geocoding", () => {
  it("does not contact any provider without a configured key", async () => {
    vi.stubEnv("GEOAPIFY_API_KEY", "");
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    expect(await reverseGeocode(location.latitude, location.longitude)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("only returns the provider's actual formatted address", async () => {
    vi.stubEnv("GEOAPIFY_API_KEY", "unit-test-placeholder");
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ results: [{ formatted: "QA resolved address", private: "omit" }] }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await reverseGeocode(location.latitude, location.longitude)).toBe("QA resolved address");
    expect(fetchMock.mock.calls[0][1].cache).toBe("no-store");
    expect(fetchMock.mock.calls[0][0].origin).toBe("https://api.geoapify.com");
  });
  it.each([429, 500, 503])("falls back on provider HTTP %s", async status => {
    vi.stubEnv("GEOAPIFY_API_KEY", "unit-test-placeholder");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Unavailable", { status })));
    expect(await reverseGeocode(location.latitude, location.longitude)).toBeNull();
  });
  it("does not log failed requests or provider errors", async () => {
    vi.stubEnv("GEOAPIFY_API_KEY", "unit-test-placeholder");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("sensitive upstream data")));
    const error = vi.spyOn(console, "error");
    expect(await reverseGeocode(location.latitude, location.longitude)).toBeNull();
    expect(error).not.toHaveBeenCalled();
  });
  const request = (body: string, headers: Record<string, string> = {}) => new Request("https://aquacircle.in/api/location/reverse", { method: "POST", headers: { origin: "https://aquacircle.in", "content-type": "application/json", ...headers }, body });
  it("accepts coordinates in a private POST body and never caches the result", async () => {
    vi.stubEnv("SITE_URL", "https://aquacircle.in"); vi.stubEnv("GEOAPIFY_API_KEY", "");
    const response = await POST(request(JSON.stringify({ latitude: location.latitude, longitude: location.longitude })));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.json()).toEqual({ address: null, provider: null });
  });
  it("rejects other origins, oversized bodies and invalid coordinates", async () => {
    vi.stubEnv("SITE_URL", "https://aquacircle.in");
    expect((await POST(request("{}", { origin: "https://untrusted.example" }))).status).toBe(403);
    expect((await POST(request("x".repeat(513)))).status).toBe(413);
    expect((await POST(request('{"latitude":999,"longitude":1}'))).status).toBe(422);
    expect((await POST(request("not JSON"))).status).toBe(400);
    expect((await POST(request("{}", { "content-type": "text/plain" }))).status).toBe(415);
  });
});
