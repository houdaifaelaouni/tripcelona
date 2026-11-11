import { Bus, MapPin, Route, UserCheck } from "lucide-react";
import { SearchWidget } from "./search-widget";

/** Facts already stated in the hero copy, shown as icon bullets. */
const bullets = [
  { icon: Bus, label: "Transporte incluido" },
  { icon: UserCheck, label: "Guía local" },
  { icon: Route, label: "Logística resuelta" },
  { icon: MapPin, label: "Salida desde Estació del Nord" },
];

/**
 * Full-bleed hero (FR-01). The video only plays when provided and when the
 * visitor has not asked for reduced motion; the poster is always the first
 * paint, so the video never blocks LCP. The fixed min-height reserves space
 * so nothing shifts when media loads.
 */
export function Hero({ videoSrc, posterSrc }: { videoSrc?: string; posterSrc?: string }) {
  return (
    <section className="relative isolate flex min-h-[640px] items-end overflow-hidden bg-navy text-white md:min-h-[720px]">
      {posterSrc && (
        // eslint-disable-next-line @next/next/no-img-element -- poster must render before JS; dimensions are fixed by the container
        <img
          src={posterSrc}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
      )}
      {videoSrc && (
        <video
          className="absolute inset-0 -z-20 h-full w-full object-cover motion-reduce:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={posterSrc}
          aria-hidden
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}
      {/* Gradient overlay keeps text at AA contrast over any image. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-dark via-navy-dark/70 to-navy-dark/30"
      />

      <div className="container-site pt-24 pb-14 md:pt-32">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1 pr-3 pl-1 text-sm font-medium ring-1 ring-white/25 backdrop-blur ring-inset">
          <span className="rounded-full bg-white px-2.5 py-0.5 whitespace-nowrap text-navy">
            Cada domingo
          </span>
          Excursiones de un día desde Barcelona
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl leading-[1.15] font-semibold tracking-tight md:text-6xl md:leading-[1.1]">
          Excursiones en grupo por Cataluña desde Barcelona
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-white/90 md:text-xl">
          Excursiones de un día cada domingo desde Estació del Nord: el Pirineo, los volcanes de la
          Garrotxa y pueblos medievales de Cataluña. Transporte, guía local y logística incluidos,
          desde 55 € por persona.
        </p>
        <div className="mt-8 max-w-4xl">
          <SearchWidget />
        </div>
        <ul className="mt-10 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          {bullets.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm font-medium">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 ring-inset">
                <Icon aria-hidden className="size-5" />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
