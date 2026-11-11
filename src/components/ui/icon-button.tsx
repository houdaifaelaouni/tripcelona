/*
 * Round icon buttons (design rule: circle 32/40px, soft fill or outline).
 * Always pass an accessible `label`.
 */
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "soft" | "outline" | "brand";
type Size = "sm" | "md" | "lg";

const tones: Record<Tone, string> = {
  soft: "bg-secondary text-primary hover:bg-border",
  outline: "border border-secondary bg-white text-primary hover:shadow-lg",
  brand: "bg-blue text-white hover:bg-blue-dark",
};

const sizes: Record<Size, string> = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
};

export function iconButtonClasses(tone: Tone = "soft", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-full transition-[background-color,box-shadow] duration-200 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50",
    tones[tone],
    sizes[size],
    extra,
  );
}

export function IconButton({
  label,
  tone,
  size,
  className,
  type = "button",
  children,
  ...props
}: Omit<ComponentProps<"button">, "aria-label"> & {
  label: string;
  tone?: Tone;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      aria-label={label}
      className={iconButtonClasses(tone, size, className)}
      {...props}
    >
      {children}
    </button>
  );
}
