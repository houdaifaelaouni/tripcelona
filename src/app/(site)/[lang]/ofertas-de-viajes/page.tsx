import type { Metadata } from "next";
import Link from "@/components/i18n/link";
import { PageHero } from "@/components/layout/page-hero";
import { Suspense } from "react";
import { CatalogFilters } from "@/components/tours/catalog-filters";
import { CatalogEmptyState } from "@/components/tours/empty-state";
import { TourCard } from "@/components/tours/tour-card";
import { CardGridSkeleton } from "@/components/ui/page-skeleton";
import { cn } from "@/lib/cn";
import { destinations } from "@/lib/site";
import {
  catalogHref,
  filterTours,
  hasActiveFilters,
  parseCatalogFilters,
} from "@/lib/tours/filters";
import { getPublishedTours } from "@/lib/tours/queries";

export const metadata: Metadata = {
  title: "Ofertas de viajes: excursiones de un día desde Barcelona",
  description:
    "Excursiones en grupo cada domingo desde Estació del Nord: Pirineo, Garrotxa, Osona y Alquézar. Filtra por destino, mes, duración y precio.",
  alternates: { canonical: "/ofertas-de-viajes" },
};

export default function CatalogPage({ searchParams }: PageProps<"/[lang]/ofertas-de-viajes">) {
  return (
    <>
      <PageHero
        eyebrow="Excursiones"
        title="Ofertas de viajes"
        intro="Excursiones de un día cada domingo desde Estació del Nord, Barcelona."
      />
      <div className="container-site py-10 md:py-14">
        <Suspense fallback={<CardGridSkeleton />}>
          <CatalogResults searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function CatalogResults({
  searchParams,
}: {
  searchParams: PageProps<"/[lang]/ofertas-de-viajes">["searchParams"];
}) {
  const filters = parseCatalogFilters(await searchParams);
  const results = filterTours(await getPublishedTours(), filters);

  return (
    <>
      <nav aria-label="Destinos" className="mt-8 -mx-4 overflow-x-auto px-4 pb-1">
        <ul className="flex w-max gap-2">
          {[{ label: "Todos", area: undefined }, ...destinations].map((d) => {
            const active = filters.zona === d.area;
            return (
              <li key={d.label}>
                <Link
                  href={catalogHref({ ...filters, zona: d.area })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center rounded-full px-3.5 text-sm font-medium whitespace-nowrap ring-1 transition-colors ring-inset",
                    active
                      ? "bg-primary-solid text-white ring-transparent"
                      : "bg-primary text-tertiary ring-secondary hover:bg-secondary hover:text-primary",
                  )}
                >
                  {d.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside>
          <CatalogFilters filters={filters} />
        </aside>
        <section aria-labelledby="results-heading">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2
              id="results-heading"
              className="text-lg font-semibold text-primary"
              aria-live="polite"
            >
              {results.length === 1 ? "1 excursión" : `${results.length} excursiones`}
              {hasActiveFilters(filters) && " con estos filtros"}
            </h2>
            <nav aria-label="Ordenar" className="flex items-center gap-2 text-sm">
              <span className="text-tertiary">Ordenar:</span>
              <span className="inline-flex overflow-hidden rounded-lg shadow-xs ring-1 ring-primary ring-inset">
                {(
                  [
                    ["salida", "Próxima salida"],
                    ["precio", "Precio"],
                  ] as const
                ).map(([value, label]) => (
                  <Link
                    key={value}
                    href={catalogHref({ ...filters, orden: value })}
                    aria-current={filters.orden === value ? "true" : undefined}
                    className={cn(
                      "px-4 py-2 font-semibold transition-colors not-last:border-r not-last:border-primary",
                      filters.orden === value
                        ? "bg-secondary text-secondary_hover"
                        : "bg-primary text-secondary hover:bg-primary_hover",
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </span>
            </nav>
          </div>
          {results.length === 0 ? (
            <CatalogEmptyState />
          ) : (
            <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
              {results.map(({ tour, match }, i) => (
                <li key={tour.slug} className="flex">
                  <TourCard tour={tour} departure={match} priority={i < 2} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
