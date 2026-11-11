/**
 * Generic skeleton for streamed page bodies (catalog, tour, blog pages).
 * Full viewport height, so the footer starts below the fold and does not jump
 * when the content arrives (CLS, US-37).
 */
export function PageSkeleton() {
  return (
    <div className="container-site min-h-[100svh] py-16" role="status" aria-live="polite">
      <div className="h-8 w-2/3 animate-pulse rounded-lg bg-secondary" />
      <div className="mt-4 h-4 w-1/2 animate-pulse rounded-lg bg-secondary" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

/** Card-grid skeleton for the catalog: chip strip, filters and photo cards. */
export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="min-h-[100svh]" role="status" aria-live="polite">
      <div className="mt-6 flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-10 w-32 shrink-0 animate-pulse rounded-full bg-secondary" />
        ))}
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="hidden h-96 animate-pulse rounded-xl bg-secondary lg:block" />
        <ul className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cards }, (_, i) => (
            <li key={i}>
              <div className="aspect-square animate-pulse rounded-xl bg-secondary" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded-lg bg-secondary" />
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded-lg bg-secondary" />
            </li>
          ))}
        </ul>
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
