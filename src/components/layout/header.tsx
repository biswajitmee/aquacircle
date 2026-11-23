"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { BookingButton } from "@/components/forms/booking-provider";
import { services } from "@/content/services";
import { trapDialogFocus } from "@/lib/focus-trap";
export function Header() {
  const [dropdown, setDropdown] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const serviceButton = useRef<HTMLButtonElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  const header = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  useGSAP(
    () => {
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
        gsap.from(".brand, .desktop-nav, .header-actions", {
          y: -7,
          opacity: 0,
          duration: 0.55,
          stagger: 0.07,
          ease: "power2.out",
          clearProps: "all",
        });
    },
    { scope: header },
  );
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 20);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);
  useEffect(() => {
    setDropdown(false);
    setMobile(false);
  }, [pathname]);
  useEffect(() => {
    if (!dropdown) return;
    const outside = (e: PointerEvent) => {
      if (!nav.current?.contains(e.target as Node)) setDropdown(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [dropdown]);
  useGSAP(
    () => {
      if (dropdown && !matchMedia("(prefers-reduced-motion: reduce)").matches)
        gsap.fromTo(
          panel.current,
          { y: -8, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.22 },
        );
    },
    { dependencies: [dropdown], scope: nav, revertOnUpdate: true },
  );
  useEffect(() => {
    const el = dialog.current;
    if (!mobile || !el) return;
    el.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const trigger = menuButton.current;
    return () => {
      el.close();
      document.body.style.overflow = overflow;
      trigger?.focus({ preventScroll: true });
    };
  }, [mobile]);
  const links = [
    ["Home", "/"],
    ["How it works", "/#how-it-works"],
    ["Service areas", "/service-areas"],
    ["About", "/about"],
    ["Contact", "/contact"],
  ];
  return (
    <header
      ref={header}
      className={`site-header ${scrolled ? "is-scrolled" : ""}`}
    >
      <div className="header-inner container">
        <Logo />
        <nav
          ref={nav}
          className="desktop-nav"
          aria-label="Main navigation"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDropdown(false);
              serviceButton.current?.focus();
            }
          }}
        >
          <Link className={pathname === "/" ? "active" : ""} href="/">
            Home
          </Link>
          <div
            className="services-nav"
            onMouseEnter={() => setDropdown(true)}
            onMouseLeave={() => setDropdown(false)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node))
                setDropdown(false);
            }}
          >
            <button
              ref={serviceButton}
              aria-expanded={dropdown}
              aria-controls="services-menu"
              onClick={() => setDropdown(!dropdown)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setDropdown(true);
                  requestAnimationFrame(() =>
                    panel.current?.querySelector("a")?.focus(),
                  );
                }
              }}
            >
              Services
              <ChevronDown size={14} />
            </button>
            <div
              ref={panel}
              id="services-menu"
              className="services-dropdown"
              hidden={!dropdown}
            >
              <p className="eyebrow">CARE, AT EVERY STAGE</p>
              <div className="dropdown-grid">
                {services.map((s) => (
                  <Link
                    key={s.id}
                    href={`/services/${s.slug}`}
                    onClick={() => setDropdown(false)}
                  >
                    <span>{s.menuTitle}</span>
                    <ArrowUpRight size={16} />
                  </Link>
                ))}
                <Link href="/services/uninstallation-reinstallation?service=uninstallation">
                  Uninstallation
                </Link>
                <Link href="/services/uninstallation-reinstallation?service=reinstallation">
                  Reinstallation
                </Link>
              </div>
              <Link className="dropdown-all" href="/services">
                View all services
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
          {links.slice(1).map(([title, url]) => (
            <Link key={url} href={url}>
              {title}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <BookingButton source="navigation" className="button button-small" />
          <button
            ref={menuButton}
            className="icon-button menu-toggle"
            aria-label="Open navigation"
            aria-expanded={mobile}
            onClick={() => setMobile(true)}
          >
            <Menu />
          </button>
        </div>
        <dialog
          ref={dialog}
          className="mobile-menu"
          aria-label="Navigation"
          onKeyDown={trapDialogFocus}
          onCancel={(e) => {
            e.preventDefault();
            setMobile(false);
          }}
        >
          <div className="mobile-menu-head">
            <Logo />
            <button
              className="icon-button"
              aria-label="Close navigation"
              onClick={() => setMobile(false)}
            >
              <X />
            </button>
          </div>
          <nav aria-label="Mobile navigation">
            <Link href="/" onClick={() => setMobile(false)}>
              Home
            </Link>
            <details>
              <summary>
                Services
                <ChevronDown size={20} />
              </summary>
              <div>
                {services.map((s) => (
                  <Link
                    key={s.id}
                    href={`/services/${s.slug}`}
                    onClick={() => setMobile(false)}
                  >
                    {s.menuTitle}
                  </Link>
                ))}
                <Link href="/services" onClick={() => setMobile(false)}>
                  All services
                </Link>
              </div>
            </details>
            {links.slice(1).map(([title, url]) => (
              <Link key={url} href={url} onClick={() => setMobile(false)}>
                {title}
              </Link>
            ))}
          </nav>
          <p className="mobile-menu-note">
            Pure Care. Full Circle.
            <br />
            Water purifier care for Kolkata.
          </p>
        </dialog>
      </div>
    </header>
  );
}
