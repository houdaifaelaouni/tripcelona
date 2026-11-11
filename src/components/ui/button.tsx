/*
 * Public-site buttons in the Untitled UI button style (MIT, © 2025 Untitled
 * UI, https://github.com/untitleduico/react; see THIRD_PARTY_NOTICES.md):
 * skeuomorphic xs shadow, inset ring, 8px corners. Plain <button>/<Link> so
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
  "relative inline-flex items-center justify-center gap-1.5 text-center leading-tight font-semibold select-none",
  "transition duration-100 ease-linear motion-reduce:transition-none",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  "aria-disabled:pointer-events-none aria-disabled:opacity-50",
);

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-solid text-white shadow-xs-skeuomorphic ring-1 ring-transparent ring-inset hover:bg-brand-solid_hover",
  secondary:
    "bg-navy text-white shadow-xs-skeuomorphic ring-1 ring-transparent ring-inset hover:bg-navy-dark",
  outline:
    "bg-primary text-secondary shadow-xs-skeuomorphic ring-1 ring-primary ring-inset hover:bg-primary_hover hover:text-secondary_hover",
  ghost: "text-brand-secondary underline-offset-4 hover:text-brand-secondary_hover hover:underline",
  whatsapp:
    "bg-whatsapp text-white shadow-xs-skeuomorphic ring-1 ring-transparent ring-inset hover:brightness-95",
};

const sizes: Record<Size, string> = {
  sm: "min-h-10 px-3.5 py-2 text-sm",
  md: "min-h-11 px-4 py-2.5 text-md",
  lg: "min-h-12 px-5 py-3 text-md",
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
