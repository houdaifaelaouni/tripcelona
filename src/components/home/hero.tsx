import Link from "next/link";
import { HeroIntro } from "@/components/motion/reveal";
import { buttonClasses } from "@/components/ui/button";
import { HeroMountains } from "./illustrations";

/**
 * Hero with the headline, pitch and the two main paths: the catalog and
 * custom tours, over the brand navy gradient and the mountain illustration.
 * The fixed min-height reserves its space so nothing shifts on load.
 */
export function Hero() {
  return (
    <section className="relative isolate flex min-h-[560px] items-end overflow-hidden bg-navy text-white md:min-h-[680px]">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-dark via-navy-dark/85 to-navy"
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
