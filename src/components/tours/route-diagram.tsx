"use client";

/*
 * Route bar of the trip: a dark panel with a dashed line and a stop at each
 * place, a bus drives along the line. The line draws in once; nothing moves
 * under reduced motion.
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bus } from "lucide-react";
import { useRef } from "react";
import { useT } from "@/components/i18n/provider";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function RouteDiagram({ stops }: { stops: string[] }) {
  const t = useT();
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const trigger = { trigger: root.current, start: "top 85%", once: true };
        gsap.from("[data-route-line]", {
          scaleX: 0,
          transformOrigin: "0% 50%",
          duration: 1.1,
          ease: "power2.inOut",
          scrollTrigger: trigger,
        });
        gsap.from("[data-route-stop]", {
          scale: 0,
          duration: 0.4,
          ease: "back.out(2)",
          stagger: 0.18,
          scrollTrigger: trigger,
        });
        gsap.fromTo(
          "[data-route-bus]",
          { left: "0%" },
          {
            left: "100%",
            duration: 6,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            repeatDelay: 0.8,
            scrollTrigger: trigger,
          },
        );
      });
    },
    { scope: root },
  );

  const last = stops.length - 1;
  return (
    <div
      ref={root}
      role="img"
      aria-label={t("Ruta: {stops}", { stops: stops.join(" → ") })}
      className="rounded-2xl bg-ink px-6 pt-4 pb-6 text-white shadow-lg md:px-8"
    >
      <div className="relative mx-3 h-8">
        <div
          data-route-line
          aria-hidden
          className="absolute top-1/2 right-0 left-0 border-t-2 border-dashed border-brand-300"
        />
        <div aria-hidden className="absolute inset-x-0 top-0">
          <div
            data-route-bus
            className="absolute -top-1 -translate-x-1/2 text-brand-300"
            style={{ left: "50%" }}
          >
            <Bus className="size-6" />
          </div>
        </div>
        {stops.map((_, i) => (
          <span
            key={i}
            data-route-stop
            aria-hidden
            className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-300 bg-ink"
            style={{ left: `${(i / Math.max(last, 1)) * 100}%` }}
          />
        ))}
      </div>
      <ol
        className="mt-3 grid gap-1"
        style={{ gridTemplateColumns: `repeat(${stops.length}, minmax(0, 1fr))` }}
        aria-hidden
      >
        {stops.map((s, i) => (
          <li
            key={`${i}-${s}`}
            className={
              "text-[10px] leading-tight font-bold tracking-wide break-words uppercase sm:text-sm " +
              (i === 0 ? "text-left" : i === last ? "text-right" : "text-center")
            }
          >
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}
