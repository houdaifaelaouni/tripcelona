import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HowItWorks } from "@/components/home/alive";
import { TourCard } from "@/components/tours/tour-card";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { destinations } from "@/lib/site";
import { catalogHref } from "@/lib/tours/filters";
import { getPublishedTours } from "@/lib/tours/queries";

export const metadata: Metadata = {
  title: "Excursiones desde Barcelona | Tripcelona",
  description:
    "Excursiones en grupo cada domingo desde Estació del Nord: Pirineo, Garrotxa, Osona y Alquézar.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const tours = await getPublishedTours();
  const banner =
    tours.flatMap((tour) => tour.gallery ?? (tour.image ? [tour.image] : []))[0] ?? null;
  const bySoonest = [...tours].sort(
    (a, b) =>
      (a.departures[0] ? Date.parse(a.departures[0].startsAt) : Infinity) -
      (b.departures[0] ? Date.parse(b.departures[0].startsAt) : Infinity),
  );

  return (
    <>
      <section aria-labelledby="home-heading" className="relative overflow-hidden">
        {/* Faint grid that fades out: structure without decoration. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(to_right,var(--color-border-tertiary)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border-tertiary)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
        />
        <div className="container-site pt-14 pb-10 md:pt-24 md:pb-14">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary py-1 pr-3 pl-1 text-xs font-medium text-secondary ring-1 ring-secondary ring-inset">
            <span className="rounded-full bg-brand-primary px-2 py-0.5 text-brand-secondary">
              Cada domingo
            </span>
            Salidas desde Estació del Nord
          </p>
          <h1
            id="home-heading"
            className="mt-6 max-w-4xl text-[2.5rem] leading-[1.08] font-semibold tracking-[-0.035em] text-primary md:text-6xl md:leading-[1.05]"
          >
            Excursiones de un día desde Barcelona
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-tertiary md:text-xl md:leading-relaxed">
            Salidas en autocar con guía local durante todo el recorrido: el Pirineo, la Garrotxa y
            pueblos medievales de Cataluña.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="#tours-heading" size="lg">
              Ver próximas salidas
            </ButtonLink>
            <ButtonLink href="/crea-tu-tour" size="lg" variant="outline">
              Viajes para grupos
            </ButtonLink>
          </div>
        </div>
        {banner && (
          <div className="container-site pb-4">
            <div className="rounded-2xl bg-secondary p-1.5 ring-1 ring-secondary ring-inset md:p-2">
              <div className="relative h-56 w-full overflow-hidden rounded-xl bg-tertiary md:h-[420px]">
                <Image
                  src={banner.url}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1280px) 1248px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      <section aria-label="Explorar por destino" className="container-site py-10 md:py-14">
        <nav aria-label="Destinos" className="-mx-4 overflow-x-auto px-4 pb-1">
          <ul className="flex w-max gap-2">
            {[{ label: "Todos", area: undefined }, ...destinations].map((destination) => {
              const active = destination.area === undefined;
              return (
                <li key={destination.label}>
                  <Link
                    href={catalogHref({ zona: destination.area })}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-9 items-center rounded-full px-3.5 text-sm font-medium whitespace-nowrap ring-1 transition-colors ring-inset",
                      active
                        ? "bg-primary-solid text-white ring-transparent"
                        : "bg-primary text-tertiary ring-secondary hover:bg-secondary hover:text-primary",
                    )}
                  >
                    {destination.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <section aria-labelledby="tours-heading" className="mt-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2
              id="tours-heading"
              className="scroll-mt-24 text-2xl font-semibold tracking-tight text-primary"
            >
              {bySoonest.length === 1 ? "1 excursión" : `${bySoonest.length} excursiones`}
            </h2>
            <ButtonLink href="/ofertas-de-viajes" variant="outline">
              Ver todas las ofertas
            </ButtonLink>
          </div>
          {bySoonest.length === 0 ? (
            <div className="rounded-xl bg-secondary px-6 py-12 text-center ring-1 ring-secondary ring-inset">
              <h3 className="text-lg font-semibold text-primary">
                Estamos preparando nuevas salidas
              </h3>
              <p className="mt-2 text-tertiary">
                Vuelve pronto para descubrir nuestros próximos viajes.
              </p>
            </div>
          ) : (
            <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
              {bySoonest.map((tour, index) => (
                <li key={tour.slug} className="flex">
                  <TourCard tour={tour} priority={index < 2} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>

      <HowItWorks />
      <p className="container-site pb-16 text-center md:pb-24">
        <ButtonLink href="/preguntas-frecuentes" variant="ghost">
          Resolver dudas en las preguntas frecuentes
        </ButtonLink>
      </p>
    </>
  );
}
