/*
 * Buttons. Structure and motion adapted from Opensource UI `soft-pill-button`
 * (MIT, © 2026 Bidyut Kundu, https://opensourceui.in), re-tokened to the
 * Tripcelona palette. See THIRD_PARTY_NOTICES.md.
 */
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "whatsapp";
type Size = "sm" | "md" | "lg";
type Shape = "rounded" | "pill";

const base = cn(
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap select-none",
  "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
  "active:translate-y-px motion-reduce:active:translate-y-0",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  "aria-disabled:pointer-events-none aria-disabled:opacity-50",
);

const variants: Record<Variant, string> = {
  primary: "bg-blue text-white hover:bg-blue-dark",
  secondary: "bg-navy text-white hover:bg-navy-dark",
  outline: "border border-ink bg-white text-ink hover:bg-surface-alt",
  ghost: "text-ink underline-offset-4 hover:underline",
  whatsapp: "bg-whatsapp text-white hover:brightness-95",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-meta",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-7 text-base",
};

const shapes: Record<Shape, string> = {
  rounded: "rounded-control",
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
