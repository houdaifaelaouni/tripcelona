import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Surface card: 14px corners, hairline border, optional float shadow. */
export function Card({
  className,
  elevated = true,
  ...props
}: ComponentProps<"div"> & { elevated?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-white",
        elevated && "shadow-float",
        className,
      )}
      {...props}
    />
  );
}

type Tone = "neutral" | "brand" | "accent" | "success" | "danger" | "light";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-alt text-ink",
  brand: "bg-navy text-white",
  accent: "bg-yellow text-ink",
  success: "bg-success text-white",
  danger: "bg-danger text-white",
  light: "bg-white text-ink shadow-float",
};

/** Pill badge (status, "Últimas plazas", counts). */
export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-badge font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
