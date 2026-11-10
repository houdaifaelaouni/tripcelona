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
  className,
}: {
  size?: keyof typeof SIZE;
  label?: string;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center justify-center", className)}
    >
      <LoaderCircle
        size={SIZE[size]}
        strokeWidth={2}
        aria-hidden
        className="animate-spin motion-reduce:animate-none"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
