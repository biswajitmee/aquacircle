import { pageMetadata } from "@/lib/metadata";
import { PageIntro } from "@/components/page-intro";
import { FAQ } from "@/components/ui/faq";
import { BookingSection } from "@/components/sections";
export const metadata = pageMetadata(
  "Water purifier service questions",
  "Answers about purifier servicing, filters, repairs, installations and booking an AquaCircle visit in Kolkata.",
  "/faq",
);
export default function FAQPage() {
  return (
    <>
      <PageIntro
        eyebrow="Frequently asked questions"
        title="A little clarity goes a long way."
        description="A few useful answers before you request a visit. For anything specific to your purifier, tell us what’s happening."
      />
      <div className="container" style={{ paddingBottom: 65 }}>
        <FAQ />
      </div>
      <BookingSection />
    </>
  );
}
