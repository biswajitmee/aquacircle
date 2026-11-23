"use client";
import { useRef, useState } from "react";
import { Plus, Minus } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { faqs } from "@/content/services";
import { BookingButton } from "@/components/forms/booking-provider";
export function FAQ({ firstOpen = true }: { firstOpen?: boolean }) {
  const [opened, setOpened] = useState<number | null>(firstOpen ? 0 : null);
  const root = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: root });
  const toggle = contextSafe((index: number) => {
    const next = opened === index ? null : index;
    const panels = root.current?.querySelectorAll<HTMLElement>(".faq-answer");
    panels?.forEach((panel, i) => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches)
        panel.style.height = i === next ? "auto" : "0px";
      else
        gsap.to(panel, {
          height: i === next ? "auto" : 0,
          duration: 0.3,
          ease: "power2.inOut",
          overwrite: true,
        });
    });
    setOpened(next);
  });
  return (
    <div className="faq-list" ref={root}>
      {faqs.map((faq, i) => (
        <div
          className={`faq-item ${opened === i ? "is-open" : ""}`}
          key={faq.question}
        >
          <h3>
            <button
              id={`faq-question-${i}`}
              onClick={() => toggle(i)}
              aria-expanded={opened === i}
              aria-controls={`faq-answer-${i}`}
            >
              <span>{faq.question}</span>
              {opened === i ? <Minus size={20} /> : <Plus size={20} />}
            </button>
          </h3>
          <div
            id={`faq-answer-${i}`}
            className="faq-answer"
            role="region"
            aria-labelledby={`faq-question-${i}`}
            style={{ height: firstOpen && i === 0 ? "auto" : 0 }}
            inert={opened !== i}
            aria-hidden={opened !== i}
          >
            <div className="faq-answer-inner">
              <p>{faq.answer}</p>
              {faq.service && (
                <BookingButton
                  service={faq.service}
                  source="faq"
                  className="text-link"
                >
                  Start a request
                </BookingButton>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
