/** Generic skeleton for segment-level loading.tsx files (catalog, tour pages). */
export function PageSkeleton() {
  return (
    <div className="container-site py-16" role="status" aria-live="polite">
      <div className="h-8 w-2/3 animate-pulse rounded-control bg-surface-alt" />
      <div className="mt-4 h-4 w-1/2 animate-pulse rounded-control bg-surface-alt" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
