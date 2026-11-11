import { LoadingIndicator } from "@/components/uui/application/loading-indicator/loading-indicator";

/** Untitled UI loading indicator, centred in the content area. */
export function LoadingScreen({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status">
      <LoadingIndicator type="line-spinner" size="md" label={label} />
    </div>
  );
}
