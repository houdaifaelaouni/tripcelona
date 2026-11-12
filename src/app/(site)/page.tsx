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
      <section aria-labelledby="home-heading" className="border-b border-secondary">
        {banner && (
          <div className="relative h-52 w-full overflow-hidden bg-secondary md:h-80">
            <Image src={banner.url} alt="" fill priority sizes="100vw" className="object-cover" />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-navy-dark/60 to-navy-dark/5"
            />
          </div>
        )}
        <div className="container-site py-10 md:py-12">
          <p className="text-sm font-semibold text-brand-secondary md:text-md">
            Day trips desde Barcelona
          </p>
          <h1
            id="home-heading"
            className="mt-3 text-4xl leading-[1.15] font-semibold tracking-tight text-primary md:text-5xl"
          >
            Viajes
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-tertiary md:text-xl">
            Salidas de un día en autocar desde Barcelona, con guía local durante todo el recorrido.
          </p>
        </div>
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
                      "inline-flex h-10 items-center rounded-lg px-3.5 text-sm font-semibold whitespace-nowrap shadow-xs ring-1 transition-colors ring-inset",
                      active
                        ? "bg-brand-secondary text-brand-secondary ring-brand"
                        : "bg-primary text-secondary ring-primary hover:bg-primary_hover",
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
            <h2 id="tours-heading" className="text-lg font-semibold text-primary">
              {bySoonest.length === 1 ? "1 excursión" : `${bySoonest.length} excursiones`}
            </h2>
            <ButtonLink href="/ofertas-de-viajes" variant="outline">
              Ver todas las ofertas
            </ButtonLink>
          </div>
          {bySoonest.length === 0 ? (
            <div className="rounded-2xl bg-secondary px-6 py-12 text-center">
              <h3 className="text-lg font-semibold text-primary">Estamos preparando nuevas salidas</h3>
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
