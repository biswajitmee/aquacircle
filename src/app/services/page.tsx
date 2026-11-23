import { pageMetadata } from "@/lib/metadata";
import { PageIntro } from "@/components/page-intro";
import { ServiceGrid } from "@/components/services/service-grid";
import {
  HowItWorks,
  PricingSection,
  BookingSection,
} from "@/components/sections";
export const metadata = pageMetadata(
  "Water purifier services in Kolkata",
  "Explore installation, routine servicing, repairs, filter replacement and reinstallation with AquaCircle. Request a visit with a clear service scope.",
  "/services",
);
export default function Services() {
  return (
    <>
      <PageIntro
        eyebrow="Our services"
        title="A little care. At every stage."
        description="From the first fitting to your next move, find the right kind of attention for your water purifier. Choose a service to start a request."
      />
      <div className="container page-services">
        <ServiceGrid />
      </div>
      <HowItWorks />
      <PricingSection />
      <BookingSection />
    </>
  );
}
