import type { Metadata } from "next";
import localFont from "next/font/local";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BookingProvider } from "@/components/forms/booking-provider";
import { business } from "@/config/business";
import "./globals.css";
const manrope = localFont({
  src: "./fonts/manrope-latin-variable.woff2",
  weight: "200 800",
  variable: "--font-manrope",
  display: "swap",
  fallback: ["Arial"],
});
export const metadata: Metadata = {
  metadataBase: new URL(business.url),
  title: {
    default: "Water Purifier Service in Kolkata | AquaCircle",
    template: "%s | AquaCircle",
  },
  description:
    "Request water purifier installation, servicing, repairs and filter replacement in Kolkata with AquaCircle. Contact us to confirm service availability.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "AquaCircle",
    images: ["/opengraph-image"],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={manrope.variable}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <BookingProvider>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </BookingProvider>
      </body>
    </html>
  );
}
