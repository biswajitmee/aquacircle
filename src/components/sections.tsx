import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Droplet,
  Layers3,
  ClipboardCheck,
  Search,
  MessageCircle,
  CircleCheck,
} from "lucide-react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/animations/reveal";
import { ServiceGrid } from "@/components/services/service-grid";
import { AreaCheck } from "@/components/forms/area-check";
import { FAQ } from "@/components/ui/faq";
import { EnquiryForm } from "@/components/forms/enquiry-form";
export function TrustStrip() {
  return (
    <div className="trust-strip">
      <div className="container trust-inner">
        {[
          [Droplet, "Clear service scope"],
          [Layers3, "Parts quoted before fitting"],
          [ClipboardCheck, "Service record after the visit"],
        ].map(([Icon, label]) => {
          const Component = Icon as typeof Droplet;
          return (
            <div key={String(label)}>
              <Component size={23} strokeWidth={1.5} />
              <span>{String(label)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export function ServicesSection() {
  return (
    <section id="services" className="section services-section">
      <Reveal className="container">
        <div data-reveal className="section-heading">
          <Eyebrow>OUR SERVICES</Eyebrow>
          <h2>Care for every stage of your purifier’s life.</h2>
        </div>
        <ServiceGrid />
        <div className="services-bottom">
          <p>Not sure where to start? We’re here to help.</p>
          <Link className="text-link" href="/services">
            Explore all services
            <ArrowRight size={18} />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
export function HowItWorks() {
  return (
    <section id="how-it-works" className="how-section section">
      <Reveal className="container">
        <div data-reveal>
          <Eyebrow>HOW IT WORKS</Eyebrow>
          <h2>Good care starts with a conversation.</h2>
        </div>
        <div className="steps-grid">
          {[
            [
              "Tell us what you need",
              "Choose a service and share your purifier details.",
            ],
            [
              "Confirm the visit",
              "We confirm your area, requirements and availability.",
            ],
            [
              "Understand the work",
              "Review the recommended work and price before approval.",
            ],
          ].map(([title, copy], i) => (
            <div data-reveal className="step" key={title}>
              <span className="step-number">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
export function PricingSection() {
  return (
    <section className="pricing-section">
      <Reveal className="container pricing-inner">
        <div data-reveal>
          <h2>
            Know the work.
            <br />
            Understand the price.
          </h2>
          <p>
            Your visit covers the work listed in your booking.
            <br />
            Additional repairs or parts are explained before work begins.
          </p>
          <Link className="text-link light-link" href="/services">
            Explore services
            <ArrowRight size={18} />
          </Link>
        </div>
        <div data-reveal className="price-lines">
          {["Visit & labour", "Approved replacement parts", "Clear total"].map(
            (line, i) => (
              <div key={line}>
                <span>{line}</span>
                <span className="price-symbol" aria-hidden="true">
                  {i === 0 ? "01" : i === 1 ? "+" : "="}
                </span>
              </div>
            ),
          )}
        </div>
      </Reveal>
    </section>
  );
}
export function AboutSection() {
  return (
    <section className="about-section section">
      <Reveal className="container about-grid">
        <div data-reveal className="about-image">
          <Image
            src="/images/about/about.webp"
            alt="Technician carefully working on a water purifier in a home kitchen"
            fill
            sizes="(max-width: 767px) 100vw, 50vw"
          />
        </div>
        <div data-reveal className="about-copy">
          <Eyebrow>ABOUT AQUACIRCLE</Eyebrow>
          <h2>
            Water purifier care,
            <br />
            closer to home.
          </h2>
          <p>
            AquaCircle focuses on water purifier care for homes in Kolkata. From
            a new installation to routine maintenance, we make each visit clear
            and easy to arrange.
          </p>
          <Link className="text-link" href="/about">
            Our approach
            <ArrowRight size={18} />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
export function AreaSection() {
  return (
    <section className="area-section">
      <Reveal className="container area-inner">
        <div data-reveal>
          <Eyebrow>KOLKATA</Eyebrow>
          <h2>Let’s check your area.</h2>
          <p>Enter your PIN code so we can confirm service availability.</p>
        </div>
        <AreaCheck />
      </Reveal>
    </section>
  );
}
export function VisitSection() {
  return (
    <section className="visit-section section">
      <Reveal className="container">
        <h2 data-reveal>What happens during your visit</h2>
        <div className="visit-grid">
          {[
            [Search, "Check", "Inspect the purifier and understand the issue."],
            [
              MessageCircle,
              "Explain",
              "Discuss the work and any replacement parts.",
            ],
            [
              CircleCheck,
              "Complete",
              "Check operation and share the service details.",
            ],
          ].map(([Icon, title, copy]) => {
            const Component = Icon as typeof Search;
            return (
              <div data-reveal key={String(title)}>
                <Component size={27} strokeWidth={1.4} />
                <div>
                  <h3>{String(title)}</h3>
                  <p>{String(copy)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
export function FAQSection() {
  return (
    <section className="faq-section section">
      <Reveal className="container">
        <div className="section-heading" data-reveal>
          <Eyebrow>A FEW ANSWERS</Eyebrow>
          <h2>Questions, answered.</h2>
        </div>
        <FAQ />
      </Reveal>
    </section>
  );
}
export function BookingSection() {
  return (
    <section id="request-visit" className="booking-section">
      <Reveal className="container booking-grid">
        <div data-reveal>
          <Eyebrow>LET’S GET STARTED</Eyebrow>
          <h2>
            Give your purifier
            <br />
            the care it needs.
          </h2>
          <p>
            Tell us what you need help with. We’ll get in touch to confirm the
            next step.
          </p>
        </div>
        <EnquiryForm source="contact-form" />
      </Reveal>
    </section>
  );
}
