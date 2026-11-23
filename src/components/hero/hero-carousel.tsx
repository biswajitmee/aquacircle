"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { BookingButton } from "@/components/forms/booking-provider";
export const slides = [
  {
    label: "Installation",
    image: "installation",
    alt: "RO water purifier framed by a clear arc of water in an aqua kitchen",
  },
  {
    label: "Routine care",
    image: "routine",
    alt: "Fresh water pouring into a glass with light dancing across the surface",
  },
  {
    label: "Filters",
    image: "filters",
    alt: "Water purifier filter cartridges displayed on translucent aqua plinths",
  },
  {
    label: "Repairs",
    image: "repair",
    alt: "Gloved hands inspecting purifier components on a turquoise workbench",
  },
  {
    label: "Reinstallation",
    image: "reinstallation",
    alt: "Bright modern kitchen with an under-sink purifier and a moving box",
  },
];
const wave = (offset: number) =>
  `polygon(${Array.from({ length: 25 }, (_, i) => `${offset + Math.sin((i / 24) * Math.PI * 2) * 12}% ${(i / 24) * 100}%`).join(",")},100% 100%,100% 0%)`;
const droplet = (scale: number) =>
  `polygon(${Array.from({ length: 49 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    const x = Math.sin(a) * (1 - Math.cos(a) * 0.38);
    const y = -Math.cos(a);
    return `${50 + x * scale}% ${50 + y * scale}%`;
  }).join(",")})`;
export function HeroCarousel() {
  const root = useRef<HTMLElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  const current = useRef(0);
  const moving = useRef(false);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from(
            "[data-hero-copy]",
            { y: 22, opacity: 0, stagger: 0.1, duration: 0.8 },
            0,
          )
          .fromTo(
            visual.current,
            { clipPath: "circle(0% at 60% 50%)" },
            {
              clipPath: "circle(75% at 50% 50%)",
              duration: 1.1,
              clearProps: "clipPath",
            },
            0.05,
          )
          .from(".hero-controls", { opacity: 0, y: 8, duration: 0.6 }, 0.35);
      });
      return () => {
        timeline.current?.kill();
        mm.revert();
        moving.current = false;
      };
    },
    { scope: root },
  );
  const goTo = contextSafe((next: number) => {
    next = (next + slides.length) % slides.length;
    if (moving.current || next === current.current) return;
    const layers =
      visual.current?.querySelectorAll<HTMLElement>(".slide-layer");
    if (!layers) return;
    moving.current = true;
    setBusy(true);
    const from = layers[current.current];
    const to = layers[next];
    const image = to.querySelector<HTMLElement>(".slide-main");
    const ribbons = to.querySelectorAll<HTMLElement>(".ribbon");
    const finish = () => {
      gsap.set(from, { opacity: 0, zIndex: 0, clipPath: "none" });
      gsap.set(to, { opacity: 1, zIndex: 1, clipPath: "none" });
      gsap.set(image, { opacity: 1, scale: 1 });
      if (ribbons.length) gsap.set(ribbons, { opacity: 0 });
      current.current = next;
      setActive(next);
      moving.current = false;
      setBusy(false);
      setAnnouncement(`${slides[next].label}, slide ${next + 1} of 5`);
    };
    gsap.set(to, { opacity: 1, zIndex: 2 });
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    const duration = matchMedia("(max-width: 767px)").matches ? 0.55 : 1.05;
    const tl = gsap.timeline({ onComplete: finish });
    timeline.current = tl;
    if (next === 0)
      tl.fromTo(
        to,
        { clipPath: "circle(0% at 62% 45%)" },
        { clipPath: "circle(115% at 62% 45%)", duration, ease: "power2.inOut" },
      );
    if (next === 1)
      tl.fromTo(
        to,
        { clipPath: droplet(0) },
        { clipPath: droplet(120), duration, ease: "power2.inOut" },
      );
    if (next === 2) {
      gsap.set(image, { opacity: 0 });
      gsap.set(ribbons, { opacity: 1 });
      ribbons.forEach((ribbon, i) =>
        tl.fromTo(
          ribbon,
          { clipPath: `inset(0 ${80 - i * 20}% 100% ${i * 20}%)` },
          {
            clipPath: `inset(0 ${80 - i * 20}% 0% ${i * 20}%)`,
            duration: duration * 0.75,
            ease: "power3.inOut",
          },
          i * duration * 0.06,
        ),
      );
    }
    if (next === 3)
      tl.fromTo(
        to,
        { clipPath: "polygon(110% 0%, 110% 0%, 110% 100%, 110% 100%)" },
        {
          clipPath: "polygon(-30% 0%, 100% 0%, 100% 100%, -70% 100%)",
          duration,
          ease: "power2.inOut",
        },
      ).fromTo(
        ".repair-edge",
        { xPercent: 120, opacity: 0.65 },
        { xPercent: -150, opacity: 0, duration },
        0,
      );
    if (next === 4)
      tl.fromTo(
        to,
        { clipPath: wave(115) },
        { clipPath: wave(-20), duration, ease: "power2.inOut" },
      );
    if (next !== 2)
      tl.fromTo(
        image,
        { scale: 1.055 },
        { scale: 1, duration, ease: "power2.out" },
        0,
      );
  });
  return (
    <section
      className="hero container"
      ref={root}
      aria-label="Water purifier care"
    >
      <div className="hero-main">
        <div className="hero-copy">
          <p data-hero-copy className="eyebrow hero-eyebrow">
            WATER PURIFIER CARE IN KOLKATA
            <span />
          </p>
          <h1>
            <span data-hero-copy>Water care.</span>
            <span data-hero-copy>Made simple.</span>
          </h1>
          <p data-hero-copy className="hero-description">
            Water purifier installation, servicing
            <br className="desktop-break" /> and repairs for homes in Kolkata.
          </p>
          <div data-hero-copy className="hero-buttons">
            <BookingButton />
            <Link className="text-link" href="#services">
              Explore services
              <ArrowRight size={19} />
            </Link>
          </div>
          <p data-hero-copy className="hero-footnote">
            A little care. A better everyday.
          </p>
        </div>
        <div
          className="hero-visual"
          ref={visual}
          role="region"
          aria-roledescription="carousel"
          aria-label="Our services in pictures"
          onTouchStart={(e) => {
            touch.current = {
              x: e.touches[0].clientX,
              y: e.touches[0].clientY,
            };
          }}
          onTouchEnd={(e) => {
            if (!touch.current) return;
            const dx = e.changedTouches[0].clientX - touch.current.x;
            const dy = e.changedTouches[0].clientY - touch.current.y;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5)
              goTo(current.current + (dx < 0 ? 1 : -1));
            touch.current = null;
          }}
        >
          {slides.map((slide, i) => (
            <div
              className="slide-layer"
              data-slide={i}
              key={slide.image}
              style={{ opacity: i === 0 ? 1 : 0, zIndex: i === 0 ? 1 : 0 }}
              aria-hidden={active !== i}
              aria-roledescription="slide"
              aria-label={`${i + 1} of 5: ${slide.label}`}
            >
              <Image
                className="slide-main"
                src={`/images/hero/${slide.image}.webp`}
                alt={slide.alt}
                fill
                sizes="(max-width: 767px) 94vw, (max-width: 1400px) 52vw, 680px"
                priority={i === 0}
                loading={i === 1 ? "eager" : undefined}
                quality={85}
              />
              {i === 2 &&
                Array.from({ length: 5 }, (_, j) => (
                  <div className="ribbon" key={j} aria-hidden="true">
                    <Image
                      src={`/images/hero/${slide.image}.webp`}
                      alt=""
                      fill
                      sizes="(max-width: 767px) 94vw, 680px"
                      quality={85}
                    />
                  </div>
                ))}
              {i === 3 && <div className="repair-edge" />}
            </div>
          ))}
        </div>
      </div>
      <div className="hero-controls">
        <Link className="scroll-cue" href="#services">
          <ArrowDown size={19} />
          Scroll to explore
        </Link>
        <div className="slide-tabs" aria-label="Choose a hero slide">
          {slides.map((s, i) => (
            <button
              key={s.label}
              aria-pressed={active === i}
              onClick={() => goTo(i)}
              disabled={busy}
            >
              {s.label}
              <span
                className="slide-progress"
                style={{ transform: `scaleX(${active === i ? 1 : 0})` }}
              />
            </button>
          ))}
        </div>
        <div className="slide-navigation">
          <button
            className="icon-button"
            aria-label="Previous slide"
            onClick={() => goTo(current.current - 1)}
            disabled={busy}
          >
            <ArrowLeft size={19} />
          </button>
          <span className="slide-counter">
            <strong>{String(active + 1).padStart(2, "0")}</strong> / 05
          </span>
          <button
            className="icon-button"
            aria-label="Next slide"
            onClick={() => goTo(current.current + 1)}
            disabled={busy}
          >
            <ArrowRight size={19} />
          </button>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </section>
  );
}
