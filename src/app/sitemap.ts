import type { MetadataRoute } from "next";
import { services } from "@/content/services";
import { business } from "@/config/business";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/services",
    "/service-areas",
    "/about",
    "/contact",
    "/faq",
    "/privacy-policy",
    "/terms",
    "/service-policy",
    ...services.map((s) => `/services/${s.slug}`),
  ].map((path) => ({
    url: `${business.url}${path}`,
    changeFrequency: path === "" ? "monthly" : "yearly",
    priority: path === "" ? 1 : path.startsWith("/services") ? 0.8 : 0.5,
  }));
}
