import { SearchWidget } from "./search-widget";

/**
 * Full-bleed hero (FR-01). The video only plays when provided and when the
 * visitor has not asked for reduced motion; the poster is always the first
 * paint, so the video never blocks LCP. The fixed min-height reserves space
 * so nothing shifts when media loads.
 */
export function Hero({ videoSrc, posterSrc }: { videoSrc?: string; posterSrc?: string }) {
  return (
    <section className="relative isolate flex min-h-[560px] items-end overflow-hidden bg-navy text-white md:min-h-[600px]">
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

      <div className="container-site py-16">
        <h1 className="max-w-3xl text-display-xl md:text-5xl md:leading-[1.1]">
          Excursiones en grupo por Cataluña desde Barcelona
        </h1>
        <p className="mt-4 max-w-2xl text-base text-white/90">
          Excursiones de un día cada domingo desde Estació del Nord: el Pirineo, los volcanes de la
          Garrotxa y pueblos medievales de Cataluña. Transporte, guía local y logística incluidos,
          desde 55 € por persona.
        </p>
        <div className="mt-8 max-w-4xl">
          <SearchWidget />
        </div>
      </div>
    </section>
  );
}
