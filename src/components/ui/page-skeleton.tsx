/**
 * Generic skeleton for streamed page bodies (catalog, tour, blog pages).
 * Full viewport height, so the footer starts below the fold and does not jump
 * when the content arrives (CLS, US-37).
 */
export function PageSkeleton() {
  return (
    <div className="container-site min-h-[100svh] py-16" role="status" aria-live="polite">
      <div className="h-8 w-2/3 animate-pulse rounded-control bg-surface-alt" />
      <div className="mt-4 h-4 w-1/2 animate-pulse rounded-control bg-surface-alt" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
