/*
 * Spinner adapted from Opensource UI `spin-loader`
 * (MIT, © 2026 Bidyut Kundu, https://opensourceui.in).
 */
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

const SIZE = { sm: 18, md: 24, lg: 32 } as const;

export function Spinner({
  size = "md",
  label = "Cargando",
  decorative = false,
  className,
}: {
  size?: keyof typeof SIZE;
  label?: string;
  /** Hide from assistive tech when a visible label sits next to it. */
  decorative?: boolean;
  className?: string;
}) {
  const icon = (
    <LoaderCircle
      size={SIZE[size]}
      strokeWidth={2}
      aria-hidden
      className="animate-spin motion-reduce:animate-none"
    />
  );
  if (decorative) {
    return <span className={cn("inline-flex items-center justify-center", className)}>{icon}</span>;
  }
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center justify-center", className)}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** A spinner beside a "Cargando datos..." label on one line. */
export function SpinnerInlineWithText({
  label = "Cargando datos...",
  size = "sm",
  className,
}: {
  label?: string;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={cn("flex items-center gap-2", className)}>
      <Spinner size={size} decorative className="text-brand-secondary" />
      <span className="text-sm text-secondary">{label}</span>
    </div>
  );
}
