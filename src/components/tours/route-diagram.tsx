"use client";

/*
 * Route bar of the trip: a dark panel with a dashed line and a stop at each
 * place. The bus is driven by the scroll: it travels from Barcelona to the
 * destination and back as the reader moves down the itinerary, a solid line
 * fills in behind it, and each stop lights up (with a short pulse) when the
 * bus reaches it. The bus turns around when the reader scrolls back up.
 * Under reduced motion everything is shown in its final state and nothing moves.
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
  const last = stops.length - 1;
  const at = (i: number) => i / Math.max(last, 1);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const el = root.current!;
        const dots = gsap.utils.toArray<HTMLElement>("[data-route-stop]", el);
        const labels = gsap.utils.toArray<HTMLElement>("[data-route-label]", el);
        const pulses = gsap.utils.toArray<HTMLElement>("[data-route-pulse]", el);
        const bus = el.querySelector<HTMLElement>("[data-route-bus]");
        const busIcon = el.querySelector<HTMLElement>("[data-route-bus-icon]");
        const fill = el.querySelector<HTMLElement>("[data-route-fill]");

        // Start from an empty route: nothing reached yet.
        const reached = stops.map(() => true);
        const mark = (i: number, on: boolean) => {
          if (reached[i] === on) return;
          reached[i] = on;
          dots[i]?.toggleAttribute("data-reached", on);
          labels[i]?.toggleAttribute("data-reached", on);
          if (on && pulses[i]) {
            gsap.fromTo(
              pulses[i],
              { scale: 1, opacity: 0.7 },
              { scale: 3, opacity: 0, duration: 0.8, ease: "power2.out" },
            );
          }
        };
        stops.forEach((_, i) => mark(i, false));
        gsap.set(fill, { scaleX: 0, transformOrigin: "0% 50%" });
        gsap.set(bus, { left: "0%" });

        // Entrance: stops pop in one after the other.
        gsap.from(dots, {
          scale: 0,
          duration: 0.4,
          ease: "back.out(2)",
          stagger: 0.12,
          clearProps: "transform",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });

        // The bus bobs a little, like an engine running.
        gsap.to(busIcon, { y: -1.5, duration: 0.28, ease: "sine.inOut", repeat: -1, yoyo: true });

        // Scroll drives the trip.
        let facing = 1;
        ScrollTrigger.create({
          trigger: el,
          start: "top 80%",
          end: "top 20%",
          scrub: 0.6,
          animation: gsap
            .timeline()
            .to(bus, { left: "100%", ease: "none", duration: 1 }, 0)
            .to(fill, { scaleX: 1, ease: "none", duration: 1 }, 0),
          onUpdate: (self) => {
            const p = self.progress;
            stops.forEach((_, i) => mark(i, p >= at(i) - 0.02));
            const dir = self.direction;
            if (dir !== facing) {
              facing = dir;
              gsap.to(busIcon, { scaleX: dir, duration: 0.25, ease: "power2.out" });
            }
          },
        });
      });
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      role="img"
      aria-label={t("Ruta: {stops}", { stops: stops.join(" → ") })}
      className="group/route rounded-2xl bg-ink px-6 pt-4 pb-6 text-white shadow-lg transition-shadow duration-300 hover:shadow-xl md:px-8"
    >
      <div className="relative mx-3 h-8">
        {/* Route still to travel: dashed. */}
        <div
          aria-hidden
          className="absolute top-1/2 right-0 left-0 border-t-2 border-dashed border-brand-300/70"
        />
        {/* Route travelled: solid, fills behind the bus. */}
        <div
          data-route-fill
          aria-hidden
          className="absolute top-1/2 right-0 left-0 h-0.5 -translate-y-[1px] rounded-full bg-gradient-to-r from-brand-400 to-brand-300 shadow-[0_0_8px_rgb(147_184_253/0.6)]"
        />
        {stops.map((_, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${at(i) * 100}%` }}
          >
            <span
              data-route-pulse
              className="pointer-events-none absolute inset-0 rounded-full bg-brand-300 opacity-0"
            />
            <span
              data-route-stop
              data-reached
              className="relative block size-4 rounded-full border-2 border-brand-300 bg-ink transition-[background-color,box-shadow] duration-300 data-reached:bg-brand-300 data-reached:shadow-[0_0_0_4px_rgb(147_184_253/0.25)]"
            />
          </span>
        ))}
        <div aria-hidden className="absolute inset-x-0 top-0">
          <div
            data-route-bus
            className="absolute -top-2 z-10 -translate-x-1/2"
            style={{ left: "50%" }}
          >
            <span
              data-route-bus-icon
              className="flex size-7 items-center justify-center rounded-full bg-brand-solid text-white shadow-[0_0_0_3px_var(--color-ink),0_4px_12px_rgb(37_99_235/0.5)] transition-transform duration-300 group-hover/route:scale-110"
            >
              <Bus className="size-4" />
            </span>
          </div>
        </div>
      </div>
      <ol
        className="mt-3 grid gap-1"
        style={{ gridTemplateColumns: `repeat(${stops.length}, minmax(0, 1fr))` }}
        aria-hidden
      >
        {stops.map((s, i) => (
          <li
            key={`${i}-${s}`}
            data-route-label
            data-reached
            className={
              "text-[10px] leading-tight font-bold tracking-wide break-words text-white/50 uppercase transition-colors duration-500 data-reached:text-white sm:text-sm " +
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
