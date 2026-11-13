"use client";

/*
 * "Tu día de un vistazo": a small route diagram from Barcelona to the
 * destination with the real departure and return times. The line draws in
 * once and the bus drives along it; nothing moves under reduced motion.
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Bus, Flag, MapPin } from "lucide-react";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function RouteDiagram({
  destination,
  departs,
  returns,
  duration,
}: {
  destination: string;
  departs: string | null;
  returns: string | null;
  duration: string | null;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-route-line]", {
          scaleX: 0,
          transformOrigin: "0% 50%",
          duration: 1.1,
          ease: "power2.inOut",
          scrollTrigger: { trigger: root.current, start: "top 80%", once: true },
        });
        gsap.from("[data-route-stop]", {
          scale: 0,
          duration: 0.45,
          ease: "back.out(2)",
          stagger: 0.5,
          scrollTrigger: { trigger: root.current, start: "top 80%", once: true },
        });
        gsap.fromTo(
          "[data-route-bus]",
          { left: "0%" },
          {
            left: "100%",
            duration: 5,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            repeatDelay: 0.6,
            scrollTrigger: { trigger: root.current, start: "top 80%", once: true },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      role="img"
      aria-label={`Ruta: salida de Barcelona${departs ? ` a las ${departs}` : ""}, excursión a ${destination}${returns ? ` y regreso sobre las ${returns}` : ""}.`}
      className="rounded-2xl bg-secondary p-6 ring-1 ring-secondary ring-inset md:p-8"
    >
      <div className="relative mx-3 mt-6 mb-16 h-10">
        <div
          data-route-line
          aria-hidden
          className="absolute top-1/2 right-0 left-0 h-0 -translate-y-1/2 border-t-2 border-dashed border-brand-300"
        />
        <div
          data-route-stop
          aria-hidden
          className="absolute top-1/2 left-0 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-solid text-white shadow-md"
        >
          <MapPin className="size-4" />
        </div>
        <div
          data-route-stop
          aria-hidden
          className="absolute top-1/2 right-0 flex size-9 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary-solid text-white shadow-md"
        >
          <Flag className="size-4" />
        </div>
        <div aria-hidden className="absolute inset-x-0 top-1/2">
          <div
            data-route-bus
            className="absolute -top-5 flex size-10 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-fg-brand-primary shadow-lg ring-1 ring-secondary ring-inset"
            style={{ left: "50%" }}
          >
            <Bus className="size-5" />
          </div>
        </div>
        <div className="absolute top-full left-0 mt-5 -translate-x-3 text-left">
          <p className="text-sm font-semibold text-primary">Barcelona</p>
          <p className="text-sm text-tertiary">{departs ? `Salida ${departs}` : "Salida"}</p>
        </div>
        <div className="absolute top-full right-0 mt-5 translate-x-3 text-right">
          <p className="text-sm font-semibold text-primary">{destination}</p>
          <p className="text-sm text-tertiary">{returns ? `Regreso ${returns}` : "Día completo"}</p>
        </div>
      </div>
      {duration && (
        <p className="text-center text-sm text-tertiary">
          Duración total: <span className="font-semibold text-primary">{duration}</span>, con
          autocar y guía incluidos.
        </p>
      )}
    </div>
  );
}
