"use client";

/*
 * "Programa del viaje" as a numbered rail: a thin vertical line on the left,
 * a small "1/4" pill per stop, and the stop's time, title and description
 * beside it. Long programmes show the first stops and a "Show more" toggle.
 * With motion allowed, stops fade up in turn, the rail fills in blue with the
 * scroll, each pill turns blue (with a pulse) as it reaches the middle of the
 * screen, and hovering a stop nudges it. Static and fully lit under reduced
 * motion.
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { useT } from "@/components/i18n/provider";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type Stop = { title: string; timeLabel: string | null; body: string | null };

/** Above this many stops the list starts collapsed. */
const COLLAPSE_AFTER = 5;
/** How many stops a collapsed list shows. */
const COLLAPSED_COUNT = 4;

export function DayTimeline({ stops }: { stops: Stop[] }) {
  const t = useT();
  const root = useRef<HTMLDivElement>(null);
  const entered = useRef(false);
  const shownBefore = useRef(0);
  const collapsible = stops.length > COLLAPSE_AFTER;
  const [open, setOpen] = useState(false);
  const visible = collapsible && !open ? stops.slice(0, COLLAPSED_COUNT) : stops;
  const total = stops.length;
  const hidden = total - COLLAPSED_COUNT;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const el = root.current!;
        const items = gsap.utils.toArray<HTMLElement>("[data-stop]", el);

        if (!entered.current) {
          // Entrance: stops fade up one after the other, pills pop in.
          const trigger = {
            trigger: el,
            start: "top 82%",
            once: true,
            onEnter: () => (entered.current = true),
          };
          gsap.from("[data-stop-body]", {
            y: 16,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.1,
            scrollTrigger: trigger,
          });
          gsap.from("[data-stop-badge]", {
            scale: 0.6,
            opacity: 0,
            duration: 0.45,
            ease: "back.out(2)",
            stagger: 0.1,
            clearProps: "transform,opacity",
            scrollTrigger: trigger,
          });
        } else if (items.length > shownBefore.current) {
          // Stops revealed by "Show more" slide in.
          gsap.from(items.slice(shownBefore.current), {
            y: 12,
            opacity: 0,
            duration: 0.45,
            ease: "power2.out",
            stagger: 0.07,
            clearProps: "transform,opacity",
          });
        }

        // The rail fills in blue as the reader scrolls down the list.
        gsap.fromTo(
          "[data-rail-fill]",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            transformOrigin: "50% 0%",
            scrollTrigger: { trigger: el, start: "top 62%", end: "bottom 62%", scrub: 0.4 },
          },
        );

        items.forEach((li) => {
          const badge = li.querySelector<HTMLElement>("[data-stop-badge]");
          const pulse = li.querySelector<HTMLElement>("[data-stop-pulse]");
          // A stop turns blue once it reaches the middle of the screen.
          li.removeAttribute("data-active");
          ScrollTrigger.create({
            trigger: li,
            start: "top 62%",
            onEnter: () => {
              li.setAttribute("data-active", "");
              if (pulse)
                gsap.fromTo(
                  pulse,
                  { scale: 1, opacity: 0.5 },
                  { scale: 1.8, opacity: 0, duration: 0.8, ease: "power2.out" },
                );
              if (badge)
                gsap.fromTo(
                  badge,
                  { scale: 1.15 },
                  { scale: 1, duration: 0.5, ease: "elastic.out(1.2, 0.5)" },
                );
            },
            onLeaveBack: () => li.removeAttribute("data-active"),
          });
        });
        shownBefore.current = items.length;
      });
    },
    { scope: root, dependencies: [open], revertOnUpdate: true },
  );

  return (
    <div ref={root}>
      <ol className="relative">
        {/* The rail: grey underneath, blue fill on top. */}
        <span
          aria-hidden
          className="absolute top-3 bottom-3 left-5 w-px -translate-x-1/2 bg-(--color-border-secondary)"
        />
        <span
          aria-hidden
          data-rail-fill
          className="absolute top-3 bottom-3 left-5 w-0.5 origin-top -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-solid to-brand-300"
        />
        {visible.map((s, i) => {
          const last = i === visible.length - 1;
          return (
            <li
              key={`${i}-${s.title}`}
              data-stop
              data-active
              className={
                "group/stop relative grid grid-cols-[2.5rem_1fr] gap-x-4 " + (last ? "" : "pb-6")
              }
            >
              <div className="flex justify-center pt-0.5">
                <span className="relative inline-flex">
                  <span
                    data-stop-pulse
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full bg-brand-solid opacity-0"
                  />
                  <span
                    data-stop-badge
                    className="relative inline-flex h-6 min-w-10 items-center justify-center rounded-full border border-secondary bg-primary px-2 font-mono text-[11px] font-medium text-tertiary tabular-nums transition-[background-color,color,border-color,box-shadow,scale] duration-500 group-hover/stop:scale-110 group-data-active/stop:border-brand-solid group-data-active/stop:bg-brand-solid group-data-active/stop:text-white group-data-active/stop:shadow-sm motion-reduce:transition-none motion-reduce:group-hover/stop:scale-100"
                  >
                    <span className="sr-only">
                      {t("Parada {i} de {n}", { i: i + 1, n: total })}
                    </span>
                    <span aria-hidden>
                      {i + 1}/{total}
                    </span>
                  </span>
                </span>
              </div>
              <div
                data-stop-body
                className="-mx-3 -my-1 rounded-xl px-3 py-1 transition-[background-color,translate] duration-300 group-hover/stop:translate-x-1 group-hover/stop:bg-brand-primary motion-reduce:group-hover/stop:translate-x-0"
              >
                {s.timeLabel && (
                  <p className="font-mono text-xs font-medium text-brand-secondary">
                    {s.timeLabel}
                  </p>
                )}
                <h3 className="text-base font-semibold tracking-tight text-primary transition-colors duration-300 group-hover/stop:text-brand-secondary md:text-lg">
                  {s.title}
                </h3>
                {s.body && <p className="mt-1 leading-relaxed text-tertiary">{s.body}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      {collapsible && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="group/more mt-4 ml-14 inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-secondary transition-colors hover:bg-brand-primary hover:text-brand-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {open ? t("Mostrar menos") : t("Mostrar {n} más", { n: hidden })}
          <ChevronDown
            aria-hidden
            className={
              "size-4 transition-transform duration-300 motion-reduce:transition-none " +
              (open ? "rotate-180" : "")
            }
          />
        </button>
      )}
      <p className="mt-4 text-sm text-tertiary">
        {t("Horarios aproximados: pueden variar según el tráfico y la meteorología.")}
      </p>
    </div>
  );
}
