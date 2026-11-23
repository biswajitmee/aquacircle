import { pageMetadata } from "@/lib/metadata";
import { PageIntro } from "@/components/page-intro";
import { AreaSection, BookingSection } from "@/components/sections";
import { business } from "@/config/business";
export const metadata = pageMetadata(
  "Check water purifier service availability",
  "Enter your Indian PIN code to enquire about AquaCircle water purifier service availability in and around Kolkata. Every address is confirmed before booking.",
  "/service-areas",
);
export default function Areas() {
  return (
    <>
      <PageIntro
        eyebrow="Service areas"
        title="Closer to home. Starting with your PIN."
        description="Tell us where your purifier is. We’ll confirm service availability for your address before arranging a visit."
      />
      <AreaSection />
      <section className="container area-page-info">
        <h2>A local service. A clear confirmation.</h2>
        <p>
          AquaCircle handles water purifier care enquiries for homes in Kolkata.
          Availability depends on your address, the service required and
          scheduling.
        </p>
        {business.areas.length ? (
          business.areas.map((a) => (
            <div key={a.name}>
              <h3>{a.name}</h3>
              <p>{a.description}</p>
            </div>
          ))
        ) : (
          <p>
            We confirm coverage individually. Enter your PIN code above to send
            an availability enquiry; a valid PIN is the starting point, rather
            than a confirmed appointment.
          </p>
        )}
        <p>
          If your visit involves moving a purifier, share both the current and
          new addresses. We’ll discuss whether removal and refitting can be
          arranged.
        </p>
      </section>
      <BookingSection />
    </>
  );
}
