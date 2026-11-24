import { coordinatesSchema } from "@/lib/service-location";

export async function reverseGeocode(latitude: number, longitude: number) {
  if (!coordinatesSchema.safeParse({ latitude, longitude }).success) return null;
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) return null;
  const url = new URL("https://api.geoapify.com/v1/geocode/reverse");
  url.search = new URLSearchParams({
    lat: String(latitude), lon: String(longitude),
    format: "json", lang: "en", limit: "1", apiKey,
  }).toString();
  try {
    // Coordinates and credentials stay out of browser URLs and application logs.
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const data = await response.json();
    const address = data?.results?.[0]?.formatted;
    return typeof address === "string" && address.trim() && address.length <= 500
      ? address.trim() : null;
  } catch {
    // Never log provider URLs, response bodies, credentials or coordinates.
    return null;
  }
}
