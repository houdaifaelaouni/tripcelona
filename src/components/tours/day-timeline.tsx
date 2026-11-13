"use client";

/*
 * "Programa del día": time pills on a dashed line. The line grows as the
 * block scrolls in and each stop fades up in turn; static under reduced motion.
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type Stop = { title: string; timeLabel: string | null; body: string | null };

export function DayTimeline({ stops }: { stops: Stop[] }) {
  const root = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-stop]", {
          y: 18,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: root.current, start: "top 80%", once: true },
        });
        gsap.from("[data-stop-pill]", {
          scale: 0.6,
          duration: 0.5,
          ease: "back.out(2)",
          stagger: 0.12,
          scrollTrigger: { trigger: root.current, start: "top 80%", once: true },
        });
        gsap.from("[data-stop-line]", {
          scaleY: 0,
          transformOrigin: "50% 0%",
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.12,
          scrollTrigger: { trigger: root.current, start: "top 80%", once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <ol ref={root}>
      {stops.map((s, i) => {
        const last = i === stops.length - 1;
        return (
          <li key={`${i}-${s.title}`} data-stop className="grid grid-cols-[5.5rem_1fr] gap-x-4">
            <div className="flex flex-col items-center">
              <span
                data-stop-pill
                className={
                  "rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-white shadow-xs " +
                  (i % 2 === 0 ? "bg-brand-solid" : "bg-primary-solid")
                }
              >
                {s.timeLabel ?? i + 1}
              </span>
              {!last && (
                <span
                  data-stop-line
                  aria-hidden
                  className="mt-1 w-0 flex-1 border-l-2 border-dashed border-brand-300"
                />
              )}
            </div>
            <div className={last ? "pt-1" : "pt-1 pb-7"}>
              <h3 className="text-md font-semibold text-primary">{s.title}</h3>
              {s.body && <p className="mt-1 text-tertiary">{s.body}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
