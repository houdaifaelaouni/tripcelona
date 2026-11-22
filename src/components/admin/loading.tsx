import { SpinnerInlineWithText } from "@/components/ui/spinner";

/** Spinner + "Cargando datos..." label, centred in the admin content area. */
export function LoadingScreen({ label = "Cargando datos..." }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <SpinnerInlineWithText label={label} />
    </div>
  );
}
