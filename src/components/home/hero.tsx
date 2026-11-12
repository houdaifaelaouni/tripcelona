import Image from "next/image";
import Link from "next/link";
import { HeroIntro } from "@/components/motion/reveal";
import { buttonClasses } from "@/components/ui/button";
import type { TourImage } from "@/lib/tours/types";
import { HeroMountains } from "./illustrations";

/**
 * Full-bleed hero over a real tour photo (the next departure), with the
 * headline, pitch and the two main paths: the catalog and custom tours.
 * The poster image is the LCP element, so it is prioritised; the fixed
 * min-height reserves its space.
 */
export function Hero({ image }: { image: TourImage | null }) {
  return (
    <section className="relative isolate flex min-h-[560px] items-end overflow-hidden bg-navy text-white md:min-h-[680px]">
      {image && (
        <Image
          src={image.url}
          alt={image.alt}
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
      )}
      {/* Overlay keeps white text at AA contrast over any photo. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-dark via-navy-dark/75 to-navy-dark/20"
      />
      <HeroMountains className="absolute inset-x-0 bottom-0 -z-10 h-40 w-full opacity-80 md:h-56" />

      <HeroIntro className="container-site pt-24 pb-14 md:pt-32 md:pb-20">
        <p data-intro className="text-sm font-semibold tracking-[0.18em] text-white/85 uppercase">
          Day trips desde Barcelona
        </p>
        <h1
          data-intro
          className="mt-3 max-w-3xl text-4xl leading-[1.1] font-bold tracking-tight md:text-6xl"
        >
          ¿Cuál es tu próximo viaje?
        </h1>
        <p data-intro className="mt-5 max-w-2xl text-lg text-white/90 md:text-xl">
          Excursiones en autocar, guías locales y la mejor compañía para descubrir el Pirineo, los
          volcanes de la Garrotxa y los pueblos medievales de Cataluña.
        </p>
        <div data-intro className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/ofertas-de-viajes"
            className={buttonClasses({ size: "lg" }, "bg-white text-navy hover:bg-brand-50")}
          >
            Ver próximos viajes
          </Link>
          <Link
            href="/crea-tu-tour"
            className={buttonClasses(
              { size: "lg" },
              "bg-white/10 text-white ring-white/30 backdrop-blur hover:bg-white/20",
            )}
          >
            Crea tu tour
          </Link>
        </div>
      </HeroIntro>
    </section>
  );
}
