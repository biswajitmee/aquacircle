import type { Metadata } from "next";
import { business } from "@/config/business";
export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | AquaCircle`,
      description,
      url: path,
      type: "website",
      locale: "en_IN",
      siteName: business.name,
      images: ["/opengraph-image"],
    },
  };
}
