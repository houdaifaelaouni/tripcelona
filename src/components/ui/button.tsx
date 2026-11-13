/*
 * Public-site buttons in the Untitled UI button style (MIT, © 2025 Untitled
 * UI, https://github.com/untitleduico/react; see THIRD_PARTY_NOTICES.md):
 * flat fill, hairline ring, 8px corners. Plain <button>/<Link> so
 * they work in server components and without JavaScript. Tripcelona colours.
 */
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "whatsapp";
type Size = "sm" | "md" | "lg";
type Shape = "rounded" | "pill";

const base = cn(
  // Labels may wrap on very narrow screens (WCAG 1.4.10 reflow at 320px).
  "relative inline-flex items-center justify-center gap-1.5 text-center leading-tight font-medium tracking-[-0.006em] select-none",
  "transition duration-100 ease-linear active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  "aria-disabled:pointer-events-none aria-disabled:opacity-50",
);

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-solid text-white shadow-xs ring-1 ring-black/5 ring-inset hover:bg-brand-solid_hover",
  secondary:
    "bg-primary-solid text-white shadow-xs ring-1 ring-transparent ring-inset hover:bg-neutral-800",
  outline: "bg-primary text-primary shadow-xs ring-1 ring-primary ring-inset hover:bg-secondary",
  ghost: "text-brand-secondary underline-offset-4 hover:text-brand-secondary_hover hover:underline",
  whatsapp:
    "bg-whatsapp text-white shadow-xs-skeuomorphic ring-1 ring-transparent ring-inset hover:brightness-95",
};

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3.5 py-2 text-sm",
  md: "min-h-10 px-4 py-2 text-sm",
  lg: "min-h-11 px-5 py-2.5 text-md",
};

const shapes: Record<Shape, string> = {
  rounded: "rounded-lg",
  pill: "rounded-full",
};

type StyleProps = { variant?: Variant; size?: Size; shape?: Shape };

export function buttonClasses(
  { variant = "primary", size = "md", shape = "rounded" }: StyleProps = {},
  extra?: string,
) {
  return cn(base, variants[variant], sizes[size], shapes[shape], extra);
}

export function Button({
  variant,
  size,
  shape,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & StyleProps) {
  return (
    <button type={type} className={buttonClasses({ variant, size, shape }, className)} {...props} />
  );
}

export function ButtonLink({
  variant,
  size,
  shape,
  className,
  ...props
}: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={buttonClasses({ variant, size, shape }, className)} {...props} />;
}
