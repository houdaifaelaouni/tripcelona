import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "whatsapp";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-bold whitespace-nowrap transition-colors select-none disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-blue text-white hover:bg-blue-dark",
  secondary: "bg-navy text-white hover:bg-navy-dark",
  outline: "border border-blue bg-white text-blue hover:bg-blue/5",
  ghost: "text-blue hover:bg-blue/10",
  whatsapp: "bg-whatsapp text-white hover:brightness-95",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-base",
  lg: "h-14 px-6 text-lg",
};

type StyleProps = { variant?: Variant; size?: Size };

export function buttonClasses(
  { variant = "primary", size = "md" }: StyleProps = {},
  extra?: string,
) {
  return cn(base, variants[variant], sizes[size], extra);
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & StyleProps) {
  return <button type={type} className={buttonClasses({ variant, size }, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={buttonClasses({ variant, size }, className)} {...props} />;
}
