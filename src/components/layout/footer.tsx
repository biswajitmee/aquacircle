import Link from "next/link";
import {
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Clock3,
  Camera as Instagram,
  Globe2 as Facebook,
  MessageCircle,
} from "lucide-react";
import { business } from "@/config/business";
import { Logo, BrandMark } from "@/components/ui/logo";
import { BookingButton } from "@/components/forms/booking-provider";
const footerServices = [
  ["Water purifier installation", "water-purifier-installation"],
  ["Routine purifier service", "routine-servicing"],
  ["Water purifier repair", "water-purifier-repair"],
  ["RO filter replacement", "filter-replacement"],
  ["UV / UF purifier support", "help-choosing-a-service"],
  ["RO membrane replacement", "filter-replacement"],
  ["Purifier uninstallation", "uninstallation-reinstallation"],
  ["Purifier reinstallation", "uninstallation-reinstallation"],
  ["Request a diagnosis", "water-purifier-repair"],
];
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <p className="eyebrow">EVERYDAY WATER CARE, SIMPLIFIED</p>
            <h2>
              Pure Care. <span>Full Circle.</span>
            </h2>
          </div>
          <BookingButton source="footer" className="button button-light">
            Let’s talk about your purifier
          </BookingButton>
        </div>
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo light />
            <p>
              Water purifier installation, servicing, repairs and filter
              replacement for homes in Kolkata.
            </p>
            <Link className="footer-domain" href="/">
              aquacircle.in
              <ArrowRight size={16} />
            </Link>
            <div className="social-links">
              {business.socials.facebook && (
                <a
                  href={business.socials.facebook}
                  aria-label="AquaCircle on Facebook"
                >
                  <Facebook />
                </a>
              )}
              {business.socials.instagram && (
                <a
                  href={business.socials.instagram}
                  aria-label="AquaCircle on Instagram"
                >
                  <Instagram />
                </a>
              )}
              {business.whatsapp && (
                <a
                  href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
                  aria-label="WhatsApp AquaCircle"
                >
                  <MessageCircle />
                </a>
              )}
              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  aria-label="Email AquaCircle"
                >
                  <Mail />
                </a>
              )}
            </div>
          </div>
          <div>
            <h3>Our services</h3>
            <ul>
              {footerServices.map(([title, slug]) => (
                <li key={title}>
                  <Link href={`/services/${slug}`}>{title}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Service areas</h3>
            <p>
              Based around Kolkata.
              <br />
              Availability is confirmed for your address.
            </p>
            {business.areas.length > 0 && (
              <ul>
                {business.areas.map((a) => (
                  <li key={a.name}>
                    <Link href="/service-areas">{a.name}</Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/service-areas" className="footer-check">
              Check your PIN code
              <ArrowRight size={15} />
            </Link>
            <p className="footer-area-note">
              A conversation is the first step. Share your location and we’ll
              take it from there.
            </p>
          </div>
          <div>
            <h3>Explore</h3>
            <ul>
              {[
                ["Home", "/"],
                ["About AquaCircle", "/about"],
                ["All services", "/services"],
                ["How it works", "/#how-it-works"],
                ["Service areas", "/service-areas"],
                ["Contact", "/contact"],
                ["FAQs", "/faq"],
              ].map(([title, url]) => (
                <li key={url}>
                  <Link href={url}>{title}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Information</h3>
            <ul>
              <li>
                <Link href="/privacy-policy">Privacy policy</Link>
              </li>
              <li>
                <Link href="/terms">Terms & conditions</Link>
              </li>
              <li>
                <Link href="/service-policy">Service policy</Link>
              </li>
              <li>
                <Link href="/service-policy#changing-a-visit">
                  Changing a visit
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Get in touch</h3>
            <ul className="contact-links">
              {business.phone && (
                <li>
                  <a href={`tel:${business.phone}`}>
                    <Phone size={15} />
                    {business.phone}
                  </a>
                </li>
              )}
              {business.email && (
                <li>
                  <a href={`mailto:${business.email}`}>
                    <Mail size={15} />
                    {business.email}
                  </a>
                </li>
              )}
              {business.address && (
                <li>
                  <MapPin size={15} />
                  {business.address}
                </li>
              )}
              {business.hours && (
                <li>
                  <Clock3 size={15} />
                  {business.hours}
                </li>
              )}
              <li>
                <Link href="/contact">
                  Send a service enquiry
                  <ArrowRight size={15} />
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} AquaCircle. All rights reserved.</p>
          <p>Designed with care. Built for everyday water care.</p>
          <BrandMark className="footer-watermark" />
        </div>
      </div>
    </footer>
  );
}
