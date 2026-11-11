import type { Metadata } from "next";
import Link from "next/link";
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

export default function CatalogPage({ searchParams }: PageProps<"/ofertas-de-viajes">) {
  return (
    <div className="container-site py-8 md:py-12">
      <h1 className="text-display-xl">Ofertas de viajes</h1>
      <p className="mt-1 max-w-2xl text-muted">
        Excursiones de un día cada domingo desde Estació del Nord, Barcelona.
      </p>
      <Suspense fallback={<CardGridSkeleton />}>
        <CatalogResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CatalogResults({
  searchParams,
}: {
  searchParams: PageProps<"/ofertas-de-viajes">["searchParams"];
}) {
  const filters = parseCatalogFilters(await searchParams);
  const results = filterTours(await getPublishedTours(), filters);

  return (
    <>
      <nav aria-label="Destinos" className="mt-6 -mx-4 overflow-x-auto px-4 pb-1">
        <ul className="flex w-max gap-2">
          {[{ label: "Todos", area: undefined }, ...destinations].map((d) => {
            const active = filters.zona === d.area;
            return (
              <li key={d.label}>
                <Link
                  href={catalogHref({ ...filters, zona: d.area })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center rounded-full border px-4 text-meta font-semibold whitespace-nowrap transition-colors",
                    active
                      ? "border-ink bg-ink text-white"
                      : "border-border-strong bg-white text-ink hover:border-ink",
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
            <h2 id="results-heading" className="text-base font-semibold" aria-live="polite">
              {results.length === 1 ? "1 excursión" : `${results.length} excursiones`}
              {hasActiveFilters(filters) && " con estos filtros"}
            </h2>
            <nav aria-label="Ordenar" className="flex items-center gap-2 text-meta">
              <span className="text-muted">Ordenar:</span>
              <span className="inline-flex rounded-full bg-surface-alt p-1">
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
                      "rounded-full px-3 py-1.5 font-semibold transition-colors",
                      filters.orden === value
                        ? "bg-white text-ink shadow-float"
                        : "text-muted hover:text-ink",
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
            <ul className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
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
