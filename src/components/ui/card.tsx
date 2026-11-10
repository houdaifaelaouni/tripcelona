import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-card border border-border bg-white shadow-card", className)}
      {...props}
    />
  );
}

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: "neutral" | "brand" | "accent" | "success" | "danger" }) {
  const tones = {
    neutral: "bg-surface-alt text-ink",
    brand: "bg-navy text-white",
    accent: "bg-yellow text-ink",
    success: "bg-success text-white",
    danger: "bg-danger text-white",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-control px-2 py-0.5 text-sm font-bold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
