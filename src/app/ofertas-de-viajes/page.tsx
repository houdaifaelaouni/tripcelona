import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CatalogFilters } from "@/components/tours/catalog-filters";
import { CatalogEmptyState } from "@/components/tours/empty-state";
import { TourCard } from "@/components/tours/tour-card";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { cn } from "@/lib/cn";
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
      <h1 className="text-3xl">Ofertas de viajes</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Excursiones de un día cada domingo desde Estació del Nord, Barcelona.
      </p>
      <Suspense fallback={<PageSkeleton />}>
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
    <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside>
        <CatalogFilters filters={filters} />
      </aside>
      <section aria-labelledby="results-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="results-heading" className="text-base" aria-live="polite">
            {results.length === 1 ? "1 excursión" : `${results.length} excursiones`}
            {hasActiveFilters(filters) && " con estos filtros"}
          </h2>
          <nav aria-label="Ordenar" className="flex gap-1 text-sm">
            <span className="py-1 text-muted">Ordenar:</span>
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
                  "rounded-control px-2 py-1 font-bold",
                  filters.orden === value ? "bg-navy text-white" : "text-blue hover:bg-blue/10",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        {results.length === 0 ? (
          <CatalogEmptyState />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map(({ tour, match }, i) => (
              <li key={tour.slug} className="flex">
                <TourCard tour={tour} departure={match} priority={i < 2} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
