"use client";

/**
 * Alerts and toast notifications, recreated after the Untitled UI alert and
 * notification patterns (featured icon, title, supporting text, close button).
 * The toast does not hide itself on a timer (WCAG 2.2.1).
 */
import { AlertCircle, CheckCircle, InfoCircle, X } from "@untitledui/icons";
import { useState, type ReactNode } from "react";
import { FeaturedIcon } from "@/components/uui/foundations/featured-icon/featured-icon";
import { cn } from "@/lib/cn";

type Tone = "brand" | "success" | "warning" | "error" | "gray";
const ICONS = {
  brand: InfoCircle,
  gray: InfoCircle,
  success: CheckCircle,
  warning: AlertCircle,
  error: AlertCircle,
};

export function Alert({
  tone = "brand",
  title,
  children,
  action,
  dismissible = false,
  className,
}: {
  tone?: Tone;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  dismissible?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "relative flex flex-col gap-3 rounded-xl bg-primary_alt p-4 shadow-xs ring-1 ring-primary ring-inset sm:flex-row sm:items-start",
        tone === "error" && "ring-error_subtle",
        className,
      )}
    >
      <FeaturedIcon icon={ICONS[tone]} color={tone} theme="outline" size="md" />
      <div className="flex min-w-0 flex-1 flex-col gap-1 pr-8 sm:pt-0.5">
        <p className="text-sm font-semibold text-secondary">{title}</p>
        {children && <div className="text-sm text-tertiary">{children}</div>}
        {action && <div className="mt-2 flex flex-wrap gap-3">{action}</div>}
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar aviso"
          className="absolute top-2 right-2 flex size-9 items-center justify-center rounded-lg text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover"
        >
          <X aria-hidden className="size-5" />
        </button>
      )}
    </div>
  );
}

/** Floating success notification (bottom right), dismissed by the person. */
export function Toast({ message }: { message: string }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-start gap-4 rounded-xl bg-primary_alt p-4 shadow-lg ring-1 ring-secondary_alt sm:right-6 sm:bottom-6 sm:left-auto sm:mx-0"
    >
      <FeaturedIcon icon={CheckCircle} color="success" theme="outline" size="md" />
      <div className="min-w-0 flex-1 pt-0.5 pr-6">
        <p className="text-sm font-semibold text-secondary">Hecho</p>
        <p className="mt-1 text-sm text-tertiary">{message}</p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Cerrar aviso"
        className="absolute top-2 right-2 flex size-9 items-center justify-center rounded-lg text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover"
      >
        <X aria-hidden className="size-5" />
      </button>
    </div>
  );
}
