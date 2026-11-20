"use client";

/*
 * "Programa del viaje" as one animated route: Barcelona (departure) at the
 * top, the programme stops in the middle and Barcelona (return) at the
 * bottom, all on a single vertical road. As the reader scrolls, a bus drives
 * down the road, the road fills in behind it in brand blue and each stop
 * lights up with a short pulse when the bus reaches it (scrolling back up
 * reverses it). Long programmes start collapsed behind "Show more". Under
 * reduced motion everything is shown lit and nothing moves.
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bus, ChevronDown, Flag, MapPin } from "lucide-react";
import { useRef, useState } from "react";
import { useT } from "@/components/i18n/provider";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type Stop = { title: string; timeLabel: string | null; body: string | null };

/** Above this many programme stops the list starts collapsed. */
const COLLAPSE_AFTER = 5;
/** How many programme stops a collapsed list shows. */
const COLLAPSED_COUNT = 4;

type Row =
  { kind: "origin" | "return"; title: string } | { kind: "stop"; stop: Stop; index: number };

export function TripRoute({ stops, fallback }: { stops: Stop[]; fallback: string }) {
  const t = useT();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const programme = stops.length > 0 ? stops : [{ title: fallback, timeLabel: null, body: null }];
  const total = programme.length;
  const collapsible = total > COLLAPSE_AFTER;
  const shown = collapsible && !open ? programme.slice(0, COLLAPSED_COUNT) : programme;

  const rows: Row[] = [
    { kind: "origin", title: "Barcelona" },
    ...shown.map((stop, index) => ({ kind: "stop" as const, stop, index })),
    { kind: "return", title: "Barcelona" },
  ];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const el = root.current!;
        const items = gsap.utils.toArray<HTMLElement>("[data-route-row]", el);
        const markers = items.map((li) => li.querySelector<HTMLElement>("[data-route-marker]")!);
        const bus = el.querySelector<HTMLElement>("[data-route-bus]")!;
        const fill = el.querySelector<HTMLElement>("[data-route-fill]")!;
        const road = el.querySelector<HTMLElement>("[data-route-road]")!;

        // Marker centres relative to the first one, measured on refresh.
        let offsets: number[] = [];
        let length = 1;
        const measure = () => {
          const mid = (m: HTMLElement) => {
            const r = m.getBoundingClientRect();
            return r.top + r.height / 2;
          };
          const top0 = mid(markers[0]);
          offsets = markers.map((m) => mid(m) - top0);
          length = Math.max(offsets[offsets.length - 1], 1);
          gsap.set([road, fill], { height: length });
        };
        measure();

        const reached = items.map(() => true);
        const mark = (i: number, on: boolean) => {
          if (reached[i] === on) return;
          reached[i] = on;
          items[i].toggleAttribute("data-reached", on);
          const pulse = items[i].querySelector<HTMLElement>("[data-route-pulse]");
          if (on && pulse)
            gsap.fromTo(
              pulse,
              { scale: 1, opacity: 0.55 },
              { scale: 2.2, opacity: 0, duration: 0.8, ease: "power2.out" },
            );
        };
        items.forEach((_, i) => mark(i, i === 0));
        gsap.set(fill, { scaleY: 0, transformOrigin: "50% 0%" });
        gsap.set(bus, { y: 0 });

        // Entrance: rows fade up in turn.
        gsap.from("[data-route-body]", {
          y: 14,
          opacity: 0,
          duration: 0.55,
          ease: "power3.out",
          stagger: 0.08,
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });

        // The bus drives down the road with the scroll.
        ScrollTrigger.create({
          trigger: el,
          start: "top 60%",
          end: "bottom 60%",
          scrub: 0.5,
          onRefresh: measure,
          onUpdate: (self) => {
            const y = self.progress * length;
            gsap.set(bus, { y });
            gsap.set(fill, { scaleY: self.progress });
            offsets.forEach((o, i) => mark(i, i === 0 || y >= o - 2));
          },
        });
      });
    },
    { scope: root, dependencies: [open], revertOnUpdate: true },
  );

  return (
    <div ref={root}>
      <ol className="relative">
        {/* The road: grey underneath, blue fill on top, the bus riding on it. */}
        <span
          aria-hidden
          data-route-road
          className="absolute top-5 bottom-5 left-5 w-0.5 -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,var(--color-border-secondary)_0_6px,transparent_6px_11px)]"
        />
        <span
          aria-hidden
          data-route-fill
          className="absolute top-5 bottom-5 left-5 w-1 origin-top -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-solid to-cyan"
        />
        <span
          aria-hidden
          data-route-bus
          className="pointer-events-none absolute top-5 left-5 z-20 hidden -translate-x-1/2 -translate-y-1/2 motion-safe:block"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-yellow text-ink shadow-md ring-4 ring-white">
            <Bus className="size-4" />
          </span>
        </span>

        {rows.map((row, i) => {
          const last = i === rows.length - 1;
          const isEnd = row.kind !== "stop";
          return (
            <li
              key={row.kind === "stop" ? `s${row.index}-${row.stop.title}` : row.kind}
              data-route-row
              data-reached
              className={
                "group/stop relative grid grid-cols-[2.5rem_1fr] gap-x-4 " + (last ? "" : "pb-7")
              }
            >
              <div className="flex h-10 items-center justify-center">
                <span data-route-marker className="relative inline-flex">
                  <span
                    data-route-pulse
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full bg-cyan opacity-0"
                  />
                  {isEnd ? (
                    <span className="relative flex size-9 items-center justify-center rounded-full border-2 border-secondary bg-primary text-quaternary transition-colors duration-500 group-data-reached/stop:border-brand-solid group-data-reached/stop:bg-brand-solid group-data-reached/stop:text-white motion-reduce:transition-none">
                      {row.kind === "origin" ? (
                        <MapPin aria-hidden className="size-4" />
                      ) : (
                        <Flag aria-hidden className="size-4" />
                      )}
                    </span>
                  ) : (
                    <span className="relative inline-flex h-6 min-w-10 items-center justify-center rounded-full border border-secondary bg-primary px-2 font-mono text-[11px] font-medium text-tertiary tabular-nums transition-colors duration-500 group-data-reached/stop:border-brand-solid group-data-reached/stop:bg-brand-solid group-data-reached/stop:text-white motion-reduce:transition-none">
                      <span className="sr-only">
                        {t("Parada {i} de {n}", { i: row.index + 1, n: total })}
                      </span>
                      <span aria-hidden>
                        {row.index + 1}/{total}
                      </span>
                    </span>
                  )}
                </span>
              </div>
              <div
                data-route-body
                className="-mx-3 rounded-xl px-3 py-1.5 transition-colors duration-300 group-hover/stop:bg-brand-primary"
              >
                {isEnd ? (
                  <>
                    <p className="text-xs font-semibold tracking-[0.06em] text-brand-secondary uppercase">
                      {row.kind === "origin" ? t("Salida") : t("Regreso")}
                    </p>
                    <h3 className="text-base font-semibold tracking-tight text-primary md:text-lg">
                      {row.title}
                    </h3>
                  </>
                ) : (
                  <>
                    {row.stop.timeLabel && (
                      <p className="font-mono text-xs font-medium text-brand-secondary">
                        {row.stop.timeLabel}
                      </p>
                    )}
                    <h3 className="text-base font-semibold tracking-tight text-primary md:text-lg">
                      {row.stop.title}
                    </h3>
                    {row.stop.body && (
                      <p className="mt-1 leading-relaxed text-tertiary">{row.stop.body}</p>
                    )}
                    {collapsible && !open && row.index === shown.length - 1 && (
                      <MoreButton open={open} hidden={total - COLLAPSED_COUNT} onToggle={setOpen} />
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {collapsible && open && (
        <div className="ml-14">
          <MoreButton open={open} hidden={0} onToggle={setOpen} />
        </div>
      )}
      <p className="mt-4 text-sm text-tertiary">
        {t("Horarios aproximados: pueden variar según el tráfico y la meteorología.")}
      </p>
    </div>
  );
}

function MoreButton({
  open,
  hidden,
  onToggle,
}: {
  open: boolean;
  hidden: number;
  onToggle: (fn: (o: boolean) => boolean) => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => onToggle((o) => !o)}
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-secondary transition-colors hover:bg-brand-primary hover:text-brand-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
  );
}
