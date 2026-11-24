import { HeroCarousel } from "@/components/hero/hero-carousel";
import {
  TrustStrip,
  ServicesSection,
  HowItWorks,
  PricingSection,
  AboutSection,
  AreaSection,
  VisitSection,
  FAQSection,
  BookingSection,
} from "@/components/sections";
import { business } from "@/config/business";
export default function Home() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "AquaCircle",
    url: business.url,
    logo: new URL("/images/brand/aquacircle-logo.png", business.url).href,
    description:
      "Water purifier installation, servicing, repairs and filter replacement enquiries for homes in Kolkata.",
    ...(business.phone ? { telephone: business.phone } : {}),
    ...(business.email ? { email: business.email } : {}),
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
      <HeroCarousel />
      <TrustStrip />
      <ServicesSection />
      <HowItWorks />
      <PricingSection />
      <AboutSection />
      <AreaSection />
      <VisitSection />
      <FAQSection />
      <BookingSection />
    </>
  );
}
