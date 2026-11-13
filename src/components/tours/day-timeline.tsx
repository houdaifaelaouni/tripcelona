"use client";

/*
 * "Programa del viaje": one round icon per stop on a dashed line, the time
 * in mono type, a bold title and the description. Each stop fades up in turn;
 * static under reduced motion.
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
        const trigger = { trigger: root.current, start: "top 82%", once: true };
        gsap.from("[data-stop]", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: trigger,
        });
        gsap.from("[data-stop-icon]", {
          scale: 0.5,
          duration: 0.5,
          ease: "back.out(2)",
          stagger: 0.12,
          scrollTrigger: trigger,
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
            <li key={`${i}-${s.title}`} data-stop className="grid grid-cols-[3.5rem_1fr] gap-x-4">
              <div className="flex flex-col items-center">
                <span
                  data-stop-icon
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-solid text-white shadow-md ring-4 ring-brand-100"
                >
                  <Icon aria-hidden className="size-5" />
                </span>
                {!last && (
                  <span
                    aria-hidden
                    className="mt-1 w-0 flex-1 border-l-2 border-dashed border-secondary"
                  />
                )}
              </div>
              <div className={last ? "pb-1" : "pb-8"}>
                <p className="font-mono text-sm font-medium text-brand-secondary">
                  {s.timeLabel ?? String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="text-lg font-bold tracking-tight text-primary uppercase md:text-xl">
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
