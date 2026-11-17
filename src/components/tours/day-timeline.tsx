"use client";

/*
 * "Programa del viaje": one round icon per stop on a dashed line, the time
 * in mono type, a bold title and the description. Each stop fades up in turn,
 * then lights up blue (with a pulse) as it reaches the middle of the screen,
 * and the connector to the next stop draws itself with the scroll. Hovering a
 * stop nudges it and tilts its icon. Static and fully lit under reduced motion.
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Bus,
  Camera,
  Home,
  MapPin,
  Mountain,
  TrainFront,
  TreePine,
  User,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { useRef } from "react";
import { useT } from "@/components/i18n/provider";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type Stop = { title: string; timeLabel: string | null; body: string | null };

/** Picks an icon from the words of the stop; falls back to a map pin. */
function iconFor(title: string, index: number): LucideIcon {
  const s = title.toLowerCase();
  if (/salida|autocar|bus/.test(s) && index === 0) return Bus;
  if (/regreso|vuelta|llegada a barcelona/.test(s)) return Home;
  if (/cremallera|tren|telecabina|cable/.test(s)) return TrainFront;
  if (/comida|almuerzo|restaurante|degustaci/.test(s)) return Utensils;
  if (/gu[ií]a|visita guiada|tour/.test(s)) return User;
  if (/bosque|fageda|parque|valle|lago|navidad/.test(s)) return TreePine;
  if (/monta|pico|cima|santuario|ruta|senda|pasarela|ca[nñ]on/.test(s)) return Mountain;
  if (/foto|mirador/.test(s)) return Camera;
  return MapPin;
}

export function DayTimeline({ stops }: { stops: Stop[] }) {
  const t = useT();
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const el = root.current!;
        const items = gsap.utils.toArray<HTMLElement>("[data-stop]", el);

        // Entrance: each stop fades up in turn, its icon pops in.
        const trigger = { trigger: el, start: "top 82%", once: true };
        gsap.from("[data-stop-body]", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: trigger,
        });
        gsap.from("[data-stop-icon]", {
          scale: 0.5,
          opacity: 0,
          duration: 0.5,
          ease: "back.out(2)",
          stagger: 0.12,
          clearProps: "transform,opacity",
          scrollTrigger: trigger,
        });

        items.forEach((li) => {
          const icon = li.querySelector<HTMLElement>("[data-stop-icon]");
          const pulse = li.querySelector<HTMLElement>("[data-stop-pulse]");
          const line = li.querySelector<HTMLElement>("[data-stop-line]");

          // A stop turns blue once it reaches the middle of the screen,
          // with a ring that pulses out of the icon.
          li.removeAttribute("data-active");
          ScrollTrigger.create({
            trigger: li,
            start: "top 62%",
            onEnter: () => {
              li.setAttribute("data-active", "");
              if (pulse)
                gsap.fromTo(
                  pulse,
                  { scale: 1, opacity: 0.55 },
                  { scale: 1.9, opacity: 0, duration: 0.9, ease: "power2.out" },
                );
              if (icon)
                gsap.fromTo(
                  icon,
                  { rotate: -12 },
                  { rotate: 0, duration: 0.6, ease: "elastic.out(1.2, 0.5)" },
                );
            },
            onLeaveBack: () => li.removeAttribute("data-active"),
          });

          // The connector down to the next stop draws itself with the scroll.
          if (line)
            gsap.fromTo(
              line,
              { scaleY: 0 },
              {
                scaleY: 1,
                ease: "none",
                transformOrigin: "50% 0%",
                scrollTrigger: { trigger: li, start: "top 62%", end: "bottom 62%", scrub: 0.4 },
              },
            );
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      <ol>
        {stops.map((s, i) => {
          const Icon = iconFor(s.title, i);
          const last = i === stops.length - 1;
          return (
            <li
              key={`${i}-${s.title}`}
              data-stop
              data-active
              className="group/stop grid grid-cols-[3.5rem_1fr] gap-x-4"
            >
              <div className="flex flex-col items-center">
                <span className="relative flex size-11 shrink-0">
                  <span
                    data-stop-pulse
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full bg-brand-solid opacity-0"
                  />
                  <span
                    data-stop-icon
                    className="relative flex size-11 items-center justify-center rounded-full border border-brand-200 bg-primary text-brand-secondary shadow-xs ring-4 ring-brand-50 transition-[background-color,color,box-shadow,border-color,scale] duration-500 group-hover/stop:scale-110 group-data-active/stop:border-brand-solid group-data-active/stop:bg-brand-solid group-data-active/stop:text-white group-data-active/stop:shadow-md group-data-active/stop:ring-brand-100 motion-reduce:transition-none motion-reduce:group-hover/stop:scale-100"
                  >
                    <Icon
                      aria-hidden
                      className="size-5 transition-transform duration-300 group-hover/stop:-rotate-12 motion-reduce:group-hover/stop:rotate-0"
                    />
                  </span>
                </span>
                {!last && (
                  <span aria-hidden className="relative mt-1 w-0.5 flex-1">
                    <span className="absolute inset-0 border-l-2 border-dashed border-secondary" />
                    <span
                      data-stop-line
                      className="absolute inset-0 origin-top rounded-full bg-gradient-to-b from-brand-solid to-brand-300"
                    />
                  </span>
                )}
              </div>
              <div
                data-stop-body
                className={
                  "-mx-3 mb-2 rounded-xl px-3 py-1 transition-[background-color,translate] duration-300 group-hover/stop:translate-x-1 group-hover/stop:bg-brand-primary motion-reduce:group-hover/stop:translate-x-0 " +
                  (last ? "" : "pb-6")
                }
              >
                <p className="font-mono text-sm font-medium text-quaternary transition-colors duration-500 group-data-active/stop:text-brand-secondary">
                  {s.timeLabel ?? String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="text-lg font-bold tracking-tight text-primary uppercase transition-colors duration-300 group-hover/stop:text-brand-secondary md:text-xl">
                  {s.title}
                </h3>
                {s.body && <p className="mt-1 text-tertiary">{s.body}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-sm text-tertiary">
        {t("Horarios aproximados: pueden variar según el tráfico y la meteorología.")}
      </p>
    </div>
  );
}
