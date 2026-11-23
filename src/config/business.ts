import { services } from "@/content/services";
export type ApprovedArea = {
  name: string;
  pins: string[];
  description: string;
};
export const business = {
  name: "AquaCircle",
  url: process.env.SITE_URL || "https://aquacircle.in",
  tagline: "Pure Care. Full Circle.",
  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "",
  email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || "",
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "",
  hours: process.env.NEXT_PUBLIC_WORKING_HOURS || "",
  // Add only owner-approved localities and PINs. A valid PIN alone is not coverage.
  areas: [] as ApprovedArea[],
  socials: { facebook: "", instagram: "" },
  services,
  policies: { warrantyPublished: false, cancellationPublished: false },
};
