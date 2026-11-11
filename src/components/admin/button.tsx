/**
 * Admin buttons with the Untitled UI button styles (MIT, © 2025 Untitled UI,
 * https://github.com/untitleduico/react, components/base/buttons/button.tsx).
 * Native <button>/<Link> so they work in server-action forms and server
 * components; the class lists are the Untitled ones with our brand scale.
 */
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "tertiary"
  | "ghost"
  | "link"
  | "danger"
  | "danger-outline"
  | "whatsapp";
type Size = "sm" | "md" | "lg";

const root =
  "group relative inline-flex cursor-pointer items-center justify-center gap-1.5 text-center whitespace-nowrap outline-brand transition duration-100 ease-linear before:absolute focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0";

const SIZES: Record<Size, string> = {
  sm: "rounded-lg px-3 py-2 text-sm font-semibold before:rounded-[7px]",
  md: "rounded-lg px-3.5 py-2.5 text-sm font-semibold before:rounded-[7px]",
  lg: "rounded-lg px-4 py-2.5 text-md font-semibold before:rounded-[7px]",
};

const COLORS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-solid text-white shadow-xs-skeuomorphic ring-1 ring-transparent ring-inset hover:bg-brand-solid_hover before:inset-px before:border before:border-white/12 before:mask-b-from-0% [&_svg]:text-white/70",
  secondary:
    "bg-primary text-secondary shadow-xs-skeuomorphic ring-1 ring-primary ring-inset hover:bg-primary_hover hover:text-secondary_hover [&_svg]:text-fg-quaternary",
  outline:
    "bg-primary text-secondary shadow-xs-skeuomorphic ring-1 ring-primary ring-inset hover:bg-primary_hover hover:text-secondary_hover [&_svg]:text-fg-quaternary",
  tertiary:
    "text-tertiary hover:bg-primary_hover hover:text-tertiary_hover [&_svg]:text-fg-quaternary",
  ghost:
    "text-tertiary hover:bg-primary_hover hover:text-tertiary_hover [&_svg]:text-fg-quaternary",
  link: "justify-normal rounded p-0! text-brand-secondary underline-offset-4 hover:text-brand-secondary_hover hover:underline",
  danger:
    "bg-error-solid text-white shadow-xs-skeuomorphic outline-error hover:bg-error-solid_hover before:inset-px before:border before:border-white/12 before:mask-b-from-0%",
  whatsapp:
    "bg-whatsapp text-white shadow-xs-skeuomorphic hover:brightness-95 before:inset-px before:border before:border-white/12 before:mask-b-from-0%",
  "danger-outline":
    "bg-primary text-error-primary shadow-xs-skeuomorphic ring-1 ring-error_subtle outline-error ring-inset hover:bg-error-primary hover:text-error-primary_hover",
};

type StyleProps = { variant?: ButtonVariant; size?: Size };

export function adminButtonClasses(
  { variant = "primary", size = "md" }: StyleProps = {},
  extra?: string,
) {
  return cn(root, SIZES[size], COLORS[variant], extra);
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & StyleProps) {
  return (
    <button type={type} className={adminButtonClasses({ variant, size }, className)} {...props} />
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={adminButtonClasses({ variant, size }, className)} {...props} />;
}
export const buttonClasses = adminButtonClasses;
