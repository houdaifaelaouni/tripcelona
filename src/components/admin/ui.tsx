import type { ComponentProps, ReactNode } from "react";
import { Badge } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export function PageTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl">{children}</h1>
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
      className={cn("mb-6 rounded-card border border-border bg-white p-4 md:p-5", className)}
    >
      {title && <h2 className="mb-3 text-lg">{title}</h2>}
      {children}
    </section>
  );
}

/** Horizontally scrollable table on phones. */
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <table
        className={cn("w-full min-w-[560px] border-collapse text-left text-sm", className)}
        {...props}
      />
    </div>
  );
}

export const th = "border-b border-border-strong px-2 py-2 font-bold whitespace-nowrap";
export const td = "border-b border-border px-2 py-2 align-top";

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
const TOUR_LABELS = { draft: "Borrador", published: "Publicada", archived: "Archivada" };
export function TourStatus({ status }: { status: keyof typeof TOUR_TONES }) {
  return <Badge tone={TOUR_TONES[status]}>{TOUR_LABELS[status]}</Badge>;
}
