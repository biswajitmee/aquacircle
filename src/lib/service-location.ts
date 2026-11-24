import { z } from "zod";

export const coordinatesSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
}).strict();

export const serviceLocationSchema = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("manual"),
    address: z.string().trim().min(1).max(500),
    geocoded: z.boolean().optional(),
  }).strict(),
  z.object({
    source: z.literal("browser"),
    address: z.string().trim().min(1).max(500),
    latitude: coordinatesSchema.shape.latitude,
    longitude: coordinatesSchema.shape.longitude,
    accuracy: z.number().finite().min(0),
    pin: z.string().max(6),
    confirmed: z.literal(true),
    geocoded: z.boolean().optional(),
  }).strict(),
]);
export type ServiceLocation = z.infer<typeof serviceLocationSchema>;
export type CapturedLocation = Extract<ServiceLocation, { source: "browser" }>;

export function mapsLink(location: ServiceLocation) {
  const url = new URL(location.source === "browser"
    ? "https://www.google.com/maps/dir/"
    : "https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set(location.source === "browser" ? "destination" : "query",
    location.source === "browser"
      ? `${location.latitude},${location.longitude}`
      : location.address);
  return url.href;
}

export function locationFields(data: { location?: ServiceLocation | null; address?: string; pin: string }) {
  const parsed = serviceLocationSchema.safeParse(data.location);
  let location = parsed.success ? parsed.data : undefined;
  if (location?.source === "browser" && location.pin !== data.pin) location = undefined;
  // Preserve the original optional address field as a manual-address fallback.
  if (!location && data.address?.trim()) {
    location = { source: "manual", address: data.address.trim() };
  }
  const fields = {
    serviceLocation: location?.address || "Location not shared",
    latitude: location?.source === "browser" ? String(location.latitude) : "",
    longitude: location?.source === "browser" ? String(location.longitude) : "",
    locationAccuracy: location?.source === "browser" ? `${location.accuracy} metres` : "",
    locationSource: location ? (location.source === "browser" ? "Browser Geolocation" : "Manually Entered") : "Location not shared",
    googleMaps: location ? mapsLink(location) : "",
  };
  return {
    ...fields,
    serviceLocationDetails: [
      "SERVICE LOCATION DETAILS",
      `Customer Address: ${fields.serviceLocation}`,
      `GPS Latitude: ${fields.latitude || "Not shared"}`,
      `GPS Longitude: ${fields.longitude || "Not shared"}`,
      `Location Accuracy: ${fields.locationAccuracy || "Not shared"}`,
      `Location Source: ${fields.locationSource}`,
      `Google Maps:\n${fields.googleMaps || "Location not shared"}`,
      ...(location?.geocoded ? ["Address lookup: Geoapify (https://www.geoapify.com/) · © OpenStreetMap contributors (https://www.openstreetmap.org/copyright)"] : []),
    ].join("\n"),
  };
}

export function locationError(code: number) {
  if (code === 1) return "Location access was not granted. You can enter your address manually.";
  if (code === 3) return "Location detection timed out. Try again or enter your address manually.";
  return "Your location could not be detected. Try again or enter your address manually.";
}
