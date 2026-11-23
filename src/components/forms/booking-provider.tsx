"use client";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { ServiceId } from "@/content/services";
import { serviceLabel } from "@/content/services";
import type { EnquirySource } from "@/lib/validation";
import { EnquiryForm } from "./enquiry-form";
import { trapDialogFocus } from "@/lib/focus-trap";
type Booking = { service?: ServiceId; source?: EnquirySource; pin?: string };
const Context = createContext<{ openBooking: (booking?: Booking) => void }>({
  openBooking: () => {},
});
export const useBooking = () => useContext(Context);
export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const closing = useRef(false);
  const exitMotion = useRef<gsap.core.Tween | null>(null);
  const scrollY = useRef(0);
  const openBooking = useCallback((value: Booking = {}) => {
    trigger.current = document.activeElement as HTMLElement;
    setBooking({ source: "hero", ...value });
  }, []);
  const close = useCallback(() => {
    if (busy || closing.current) return;
    const finish = () => {
      dialog.current?.close();
      setBooking(null);
      closing.current = false;
    };
    closing.current = true;
    if (
      dialog.current &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      exitMotion.current = gsap.to(dialog.current, {
        opacity: 0,
        y: 12,
        duration: 0.18,
        ease: "power2.in",
        onComplete: finish,
      });
    else finish();
  }, [busy]);
  useGSAP(
    () => {
      if (!booking || !dialog.current) return;
      const el = dialog.current;
      scrollY.current = window.scrollY;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      el.showModal();
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        gsap.fromTo(
          el,
          { y: 24, opacity: 0, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
            clearProps: "transform,opacity",
          },
        );
      return () => {
        exitMotion.current?.kill();
        closing.current = false;
        document.body.style.overflow = previousOverflow;
        el.close();
        trigger.current?.focus({ preventScroll: true });
      };
    },
    { dependencies: [booking], scope: dialog, revertOnUpdate: true },
  );
  return (
    <Context.Provider value={{ openBooking }}>
      {children}
      <dialog
        ref={dialog}
        className="booking-dialog"
        aria-labelledby="booking-title"
        onKeyDown={trapDialogFocus}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (
            e.target === dialog.current &&
            !dialog.current?.querySelector('form[data-dirty="true"]')
          )
            close();
        }}
      >
        {booking && (
          <div className="dialog-inner">
            <button
              className="icon-button modal-close"
              onClick={close}
              aria-label="Close booking form"
              disabled={busy}
            >
              <X size={22} />
            </button>
            <p className="eyebrow">
              LET’S TAKE CARE OF IT
              <span />
            </p>
            <h2 id="booking-title">
              {booking.service
                ? `Book ${serviceLabel(booking.service)}`
                : "Request a visit."}
            </h2>
            <p className="dialog-description">
              A few details to get started. We’ll contact you to confirm the
              next step.
            </p>
            <EnquiryForm
              key={`${booking.service}-${booking.pin}-${booking.source}`}
              service={booking.service}
              pin={booking.pin}
              source={booking.source || "hero"}
              expanded
              onBusy={setBusy}
              onCancel={close}
            />
          </div>
        )}
      </dialog>
    </Context.Provider>
  );
}
export function BookingButton({
  children = "Request a visit",
  service,
  source = "hero",
  pin,
  className = "button",
  arrow = true,
}: Booking & { children?: ReactNode; className?: string; arrow?: boolean }) {
  const { openBooking } = useBooking();
  return (
    <button
      className={className}
      onClick={() => openBooking({ service, source, pin })}
    >
      {children}
      {arrow && <ArrowRight size={19} aria-hidden="true" />}
    </button>
  );
}
