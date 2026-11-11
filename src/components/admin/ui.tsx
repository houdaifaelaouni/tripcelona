import type { ComponentProps, ReactNode } from "react";
import { Badge } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export function PageTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-display-lg md:text-display-xl">{children}</h1>
      {actions}
    </div>
  );
}

export function Panel({
  title,
  children,
  className,
  id,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn("mb-6 rounded-card border border-border bg-white p-5 md:p-6", className)}
    >
      {title && <h2 className="mb-4 text-display-sm">{title}</h2>}
      {children}
    </section>
  );
}

/** Horizontally scrollable table on phones. */
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <table
        className={cn("w-full min-w-[560px] border-collapse text-left text-meta", className)}
        {...props}
      />
    </div>
  );
}

export const th =
  "border-b border-border px-3 py-3 text-caption font-semibold whitespace-nowrap text-muted";
export const td = "border-b border-border px-3 py-3 align-top";

const BOOKING_TONES = {
  pending: "accent",
  paid: "success",
  cancelled: "neutral",
  refunded: "danger",
} as const;
const BOOKING_LABELS = {
  pending: "Pendiente",
  paid: "Pagada",
  cancelled: "Cancelada",
  refunded: "Reembolsada",
};
export function BookingStatus({ status }: { status: keyof typeof BOOKING_TONES }) {
  return <Badge tone={BOOKING_TONES[status]}>{BOOKING_LABELS[status]}</Badge>;
}

const DEP_TONES = { open: "success", sold_out: "accent", cancelled: "danger" } as const;
const DEP_LABELS = { open: "Abierta", sold_out: "Completa", cancelled: "Cancelada" };
export function DepartureStatus({ status }: { status: keyof typeof DEP_TONES }) {
  return <Badge tone={DEP_TONES[status]}>{DEP_LABELS[status]}</Badge>;
}

const TOUR_TONES = { draft: "neutral", published: "success", archived: "danger" } as const;
export const TOUR_LABELS = { draft: "Borrador", published: "Publicada", archived: "Archivada" };
export function TourStatus({ status }: { status: keyof typeof TOUR_TONES }) {
  return <Badge tone={TOUR_TONES[status]}>{TOUR_LABELS[status]}</Badge>;
}

const REQ_TONES = { new: "accent", quoted: "brand", won: "success", lost: "neutral" } as const;
export const REQUEST_LABELS = {
  new: "Nueva",
  quoted: "Presupuestada",
  won: "Ganada",
  lost: "Perdida",
};
export function RequestStatus({ status }: { status: keyof typeof REQ_TONES }) {
  return <Badge tone={REQ_TONES[status]}>{REQUEST_LABELS[status]}</Badge>;
}
