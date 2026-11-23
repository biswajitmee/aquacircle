import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ArrowUpRight } from "lucide-react";
import { services } from "@/content/services";
import { pageMetadata } from "@/lib/metadata";
import { business } from "@/config/business";
import { Eyebrow } from "@/components/ui/eyebrow";
import { BookingButton } from "@/components/forms/booking-provider";
import { HowItWorks } from "@/components/sections";
export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  return service
    ? pageMetadata(
        `${service.menuTitle} in Kolkata`,
        service.intro,
        `/services/${slug}`,
      )
    : {};
}
export default async function ServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();
  const requested = (await searchParams).service;
  const selected =
    service.id === "relocation" &&
    (requested === "uninstallation" || requested === "reinstallation")
      ? requested
      : service.id;
  const related = services.filter((s) => s.id !== service.id).slice(0, 3);
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: service.menuTitle,
        description: service.intro,
        url: `${business.url}/services/${slug}`,
        provider: {
          "@type": "Organization",
          name: "AquaCircle",
          url: business.url,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: business.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Services",
            item: `${business.url}/services`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: service.title,
            item: `${business.url}/services/${slug}`,
          },
        ],
      },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
      <article className={`container service-detail ${service.id}`}>
        <div className="page-intro">
          <div className="breadcrumbs">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/services">Services</Link>
            <span>/</span>
            <span>{service.title}</span>
          </div>
        </div>
        <div className="service-detail-hero">
          <div className="service-detail-copy">
            <Eyebrow>THOUGHTFUL CARE, START TO FINISH</Eyebrow>
            <h1>{service.title}.</h1>
            <p>{service.intro}</p>
            <BookingButton service={selected} source="service-page">
              Request this service
            </BookingButton>
          </div>
          <div className="service-detail-image">
            <Image
              src={service.image}
              alt={service.alt}
              fill
              priority
              sizes="(max-width:767px) 94vw, 50vw"
              quality={85}
            />
          </div>
        </div>
        <div className="service-detail-body">
          <section>
            <h2>What the visit can cover</h2>
            <ul className="included-list">
              {service.included.map((item) => (
                <li key={item}>
                  <Check size={20} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="service-specific">
              <h3>{service.question}</h3>
              <p>{service.answer}</p>
            </div>
          </section>
          <section>
            <Eyebrow>KNOW BEFORE YOU BOOK</Eyebrow>
            <h2>
              Clear scope.
              <br />
              An agreed price.
            </h2>
            <p>{service.extras}</p>
            <p style={{ marginTop: 20 }}>
              The exact work, availability and quote are confirmed before your
              visit. Additional work or parts require your approval.
            </p>
            <Link
              className="text-link"
              style={{ marginTop: 25 }}
              href="/service-policy"
            >
              Read our service approach
              <ArrowUpRight size={18} />
            </Link>
          </section>
        </div>
        <section className="related-services">
          <h2>More ways we can help</h2>
          <div className="related-grid">
            {related.map((s) => (
              <Link key={s.id} href={`/services/${s.slug}`}>
                {s.title}
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </div>
        </section>
      </article>
      <HowItWorks />
    </>
  );
}
