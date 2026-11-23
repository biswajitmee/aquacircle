import { pageMetadata } from "@/lib/metadata";
import { PageIntro } from "@/components/page-intro";
import {
  AboutSection,
  BookingSection,
  VisitSection,
} from "@/components/sections";
export const metadata = pageMetadata(
  "About AquaCircle",
  "AquaCircle focuses on clear, approachable water purifier care for homes in Kolkata. Learn how we arrange visits, explain work and keep you informed.",
  "/about",
);
export default function About() {
  return (
    <>
      <PageIntro
        eyebrow="About AquaCircle"
        title="Good water care feels personal."
        description="AquaCircle focuses on water purifier care for homes in Kolkata. Our approach is straightforward: understand what you need, agree on the work and keep you informed."
      />
      <AboutSection />
      <div className="container about-values">
        <div>
          <h2>A clear conversation.</h2>
          <p>
            You don’t need to know the name of a component. Tell us what you’ve
            noticed, share your purifier details if you have them, and we’ll
            help with the next step.
          </p>
        </div>
        <div>
          <h2>A considered visit.</h2>
          <p>
            Service availability, scope and appointment details are confirmed
            with you. Recommendations and replacement parts are discussed before
            work begins.
          </p>
        </div>
        <div>
          <h2>Care that comes full circle.</h2>
          <p>
            From installation to maintenance and moving home, our service
            enquiries bring the different stages of purifier care into one
            place.
          </p>
        </div>
      </div>
      <VisitSection />
      <BookingSection />
    </>
  );
}
