import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { PageIntro } from "@/components/page-intro";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { business } from "@/config/business";
export const metadata = pageMetadata(
  "Contact AquaCircle",
  "Send AquaCircle a water purifier service enquiry. Share your name, mobile number, PIN and service needs to request a visit in Kolkata.",
  "/contact",
);
export default function Contact() {
  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="Let’s start with a conversation."
        description="Tell us what you need help with. A few details are enough to take the first step."
      />
      <div className="container contact-layout">
        <aside className="contact-aside">
          <h2>We’re here for your purifier.</h2>
          <p>
            Request installation, a routine service, help with a problem or care
            for your next move.
          </p>
          <p>
            We’ll get in touch to discuss your requirements, confirm your area
            and agree on the next step.
          </p>
          {business.phone && (
            <p>
              <a href={`tel:${business.phone}`}>{business.phone}</a>
            </p>
          )}
          {business.email && (
            <p>
              <a href={`mailto:${business.email}`}>{business.email}</a>
            </p>
          )}
          {business.address && <p>{business.address}</p>}
          {business.hours && <p>{business.hours}</p>}
          <Link className="text-link" href="/faq">
            A few helpful answers
            <ArrowRight size={17} />
          </Link>
        </aside>
        <div className="contact-form-panel">
          <p className="dialog-description">
            Fields marked * are required. Appointment details are confirmed
            separately.
          </p>
          <EnquiryForm source="contact-form" expanded />
        </div>
      </div>
    </>
  );
}
