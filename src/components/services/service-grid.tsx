"use client";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { services } from "@/content/services";
import { useBooking } from "@/components/forms/booking-provider";
export function ServiceGrid() {
  const { openBooking } = useBooking();
  return (
    <div className="service-grid">
      {services.map((service) => (
        <button
          data-reveal
          className="service-card"
          key={service.id}
          onClick={() =>
            openBooking({ service: service.id, source: "service-card" })
          }
          aria-label={`Book ${service.title}`}
        >
          <div className="service-image">
            <Image
              src={service.image}
              alt={service.alt}
              fill
              sizes="(max-width: 600px) 94vw, (max-width: 1000px) 45vw, 420px"
            />
            <span className="service-image-action">
              <ArrowUpRight size={22} />
            </span>
          </div>
          <div className="service-info">
            <span className="service-number">{service.number}</span>
            <div>
              <h3>{service.title}</h3>
              <p>{service.short}</p>
            </div>
            <ArrowUpRight className="service-arrow" size={22} />
          </div>
        </button>
      ))}
    </div>
  );
}
