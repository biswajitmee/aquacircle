export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let windowStart = 0;
let requests = 0;
const failure = (status: number) => new Response(null, {
  status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
});

export async function GET(request: Request, context: { params: Promise<{ z: string; x: string; y: string }> }) {
  const { z, x, y } = await context.params;
  if (![z, x, y].every(part => /^(0|[1-9]\d{0,6})$/.test(part))) return failure(400);
  const zoom = Number(z);
  if (zoom < 3 || zoom > 20 || Number(x) >= 2 ** zoom || Number(y) >= 2 ** zoom || new URL(request.url).search) return failure(400);
  if (request.headers.get("sec-fetch-site") === "cross-site") return failure(403);
  const origin = new URL(process.env.SITE_URL || "https://aquacircle.in").origin;
  const referer = request.headers.get("referer");
  if (referer) {
    try { if (new URL(referer).origin !== origin) return failure(403); }
    catch { return failure(403); }
  }
  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) return failure(503);
  // Best-effort per-instance protection, not a global account quota guarantee.
  if (Date.now() - windowStart >= 60000) { windowStart = Date.now(); requests = 0; }
  if (++requests > 240) return failure(429);
  const url = new URL(`https://maps.geoapify.com/v1/tile/osm-bright/${z}/${x}/${y}.png`);
  url.searchParams.set("apiKey", key);
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(7000), redirect: "error" });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/png")) return failure(503);
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 1024 * 1024) return failure(502);
    // Honor provider cache lifetime (capped at one day); never cache errors or keys.
    const cache = response.headers.get("cache-control") || "";
    const ttl = /(?:no-store|no-cache|private)/i.test(cache) ? 0 : Math.min(86400, Number(cache.match(/(?:^|[,\s])max-age=(\d+)/i)?.[1] || 0));
    return new Response(bytes, { headers: {
      "Content-Type": "image/png",
      "Cache-Control": ttl ? `public, max-age=${ttl}, s-maxage=${ttl}` : "no-store",
      "X-Robots-Tag": "noindex", "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    // Never forward provider errors/URLs, credentials, or log location requests.
    return failure(503);
  }
}
