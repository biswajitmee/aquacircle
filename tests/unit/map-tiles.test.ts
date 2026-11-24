import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/location/tiles/[z]/[x]/[y]/route";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
const request = (z = "18", x = "195417", y = "114194", headers: Record<string, string> = {}) => GET(
  new Request(`https://aquacircle.in/api/location/tiles/${z}/${x}/${y}`, { headers }),
  { params: Promise.resolve({ z, x, y }) },
);

describe("private map tile endpoint", () => {
  it("validates bounded tile coordinates and rejects cross-site requests before contacting the provider", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    for (const args of [["21", "0", "0"], ["18", "262144", "0"], ["18", "-1", "0"], ["18", "1", "../secret"]]) {
      expect((await request(...args)).status).toBe(400);
    }
    expect((await request("18", "1", "1", { "sec-fetch-site": "cross-site" })).status).toBe(403);
    expect((await request("18", "1", "1", { referer: "https://untrusted.example/" })).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("safely reports missing configuration", async () => {
    vi.stubEnv("GEOAPIFY_API_KEY", "");
    const response = await request();
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("only returns image bytes and safe cache headers, never the private key", async () => {
    vi.stubEnv("GEOAPIFY_API_KEY", "private-test-key");
    const fetchMock = vi.fn().mockResolvedValue(new Response(new Uint8Array([137, 80, 78, 71]), {
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600", "X-Provider-Secret": "private-test-key" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await request();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600, s-maxage=3600");
    expect(JSON.stringify(Object.fromEntries(response.headers))).not.toContain("private-test-key");
    expect(fetchMock.mock.calls[0][0].origin).toBe("https://maps.geoapify.com");
    expect(fetchMock.mock.calls[0][0].searchParams.get("apiKey")).toBe("private-test-key");
  });
  it("never forwards or caches provider failures", async () => {
    vi.stubEnv("GEOAPIFY_API_KEY", "private-test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private-test-key", { status: 429 })));
    const log = vi.spyOn(console, "error");
    const response = await request();
    expect(response.status).toBe(503);
    expect(await response.text()).toBe("");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(log).not.toHaveBeenCalled();
  });
});
