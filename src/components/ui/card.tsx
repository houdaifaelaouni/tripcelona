import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Surface card in the Untitled UI card style: 12px corners, inset ring, xs shadow. */
export function Card({
  className,
  elevated = true,
  ...props
}: ComponentProps<"div"> & { elevated?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-primary ring-1 ring-secondary ring-inset",
        elevated && "shadow-xs",
        className,
      )}
      {...props}
    />
  );
}

type Tone = "neutral" | "brand" | "accent" | "success" | "danger" | "light";

// Untitled UI pill-color badges (MIT, see THIRD_PARTY_NOTICES.md).
const tones: Record<Tone, string> = {
  neutral: "bg-utility-neutral-50 text-utility-neutral-700 ring-utility-neutral-200",
  brand: "bg-utility-brand-50 text-utility-brand-700 ring-utility-brand-200",
  accent: "bg-utility-amber-50 text-utility-amber-700 ring-utility-amber-200",
  success: "bg-utility-green-50 text-utility-green-700 ring-utility-green-200",
  danger: "bg-utility-red-50 text-utility-red-700 ring-utility-red-200",
  light: "bg-primary text-secondary ring-primary shadow-xs",
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
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
