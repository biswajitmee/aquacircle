import { z } from "zod";

export const coordinatesSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
}).strict();

export const addressDetailsSchema = z.object({
  flat: z.string().trim().max(100).optional(),
  building: z.string().trim().max(150).optional(),
  floor: z.string().trim().max(40).optional(),
  landmark: z.string().trim().max(200).optional(),
  entrance: z.string().trim().max(500).optional(),
}).strict();
export type AddressDetails = z.infer<typeof addressDetailsSchema>;
const pinFields = {
  address: z.string().trim().min(1).max(500),
  latitude: coordinatesSchema.shape.latitude,
  longitude: coordinatesSchema.shape.longitude,
  accuracy: z.number().finite().min(0),
  pin: z.string().max(6),
  confirmed: z.literal(true),
  geocoded: z.boolean().optional(),
  details: addressDetailsSchema.optional(),
};
export const serviceLocationSchema = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("manual"),
    address: z.string().trim().min(1).max(500),
    geocoded: z.boolean().optional(),
    details: addressDetailsSchema.optional(),
  }).strict(),
  // Retain older confirmed GPS records for pending standalone email deliveries.
  z.object({
    source: z.literal("browser"),
    ...pinFields,
  }).strict(),
  z.object({ source: z.literal("map"), ...pinFields }).strict(),
]);
export type ServiceLocation = z.infer<typeof serviceLocationSchema>;
export type CapturedLocation = Exclude<ServiceLocation, { source: "manual" }>;
export type Coordinates = z.infer<typeof coordinatesSchema>;
export type GpsPosition = Coordinates & { accuracy: number };

export function mapsLink(location: ServiceLocation) {
  const url = new URL(location.source !== "manual"
    ? "https://www.google.com/maps/dir/"
    : "https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set(location.source !== "manual" ? "destination" : "query",
    location.source !== "manual"
      ? `${location.latitude},${location.longitude}`
      : location.address);
  return url.href;
}

export function locationFields(data: { location?: ServiceLocation | null; address?: string; pin: string }) {
  const parsed = serviceLocationSchema.safeParse(data.location);
  let location = parsed.success ? parsed.data : undefined;
  if (location && location.source !== "manual" && location.pin !== data.pin) location = undefined;
  if (location?.source === "map" && data.address?.trim() && data.address.trim() !== location.address) location = undefined;
  // Preserve the original optional address field as a manual-address fallback.
  if (!location && data.address?.trim()) {
    location = { source: "manual", address: data.address.trim() };
  }
  const fields = {
    serviceLocation: location?.address || "Location not shared",
    flat: location?.details?.flat || "",
    building: location?.details?.building || "",
    floor: location?.details?.floor || "",
    landmark: location?.details?.landmark || "",
    entrance: location?.details?.entrance || "",
    latitude: location && location.source !== "manual" ? String(location.latitude) : "",
    longitude: location && location.source !== "manual" ? String(location.longitude) : "",
    locationAccuracy: location && location.source !== "manual" ? `${location.accuracy} metres` : "",
    locationSource: location ? (location.source === "map" ? "GPS + Customer-Confirmed Map Pin" : location.source === "browser" ? "Browser Geolocation" : "Manually Entered") : "Location not shared",
    googleMaps: location ? mapsLink(location) : "",
  };
  return {
    ...fields,
    serviceLocationDetails: [
      "SERVICE LOCATION",
      `Address: ${fields.serviceLocation}`,
      `Flat/House: ${fields.flat || "Not supplied"}`,
      `Building: ${fields.building || "Not supplied"}`,
      `Floor: ${fields.floor || "Not supplied"}`,
      `Landmark: ${fields.landmark || "Not supplied"}`,
      `Entrance Instructions: ${fields.entrance || "Not supplied"}`,
      `Confirmed Latitude: ${fields.latitude || "Not shared"}`,
      `Confirmed Longitude: ${fields.longitude || "Not shared"}`,
      `GPS Accuracy: ${fields.locationAccuracy || "Not shared"} (device reading, not pin precision)`,
      `Location Source: ${fields.locationSource}`,
      `Google Maps Navigation:\n${fields.googleMaps || "Location not shared"}`,
      ...(location?.geocoded ? ["Address lookup: Geoapify (https://www.geoapify.com/) · © OpenStreetMap contributors (https://www.openstreetmap.org/copyright)"] : []),
    ].join("\n"),
  };
}

export function locationError(code: number) {
  if (code === 1) return "Location access was not granted. You can enter your address manually.";
  if (code === 3) return "Location detection timed out. Try again or enter your address manually.";
  return "Your location could not be detected. Try again or enter your address manually.";
}
