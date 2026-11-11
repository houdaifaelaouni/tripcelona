/**
 * Admin building blocks. Layout and class patterns adapted from Preline UI
 * (https://github.com/htmlstreamofficial/preline, MIT + Preline UI Fair Use
 * License, © 2026 Preline Labs Ltd.): card with header/footer, table in a
 * card, stat cards and soft status badges. Tripcelona colour tokens replace
 * Preline's theme colours. See THIRD_PARTY_NOTICES.md.
 */
import type { LucideIcon } from "lucide-react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ILLUSTRATIONS, type IllustrationName } from "./illustrations";

/** Page heading: optional back link, title, one-line description, actions. */
export function PageTitle({
  children,
  actions,
  description,
  back,
}: {
  children: ReactNode;
  actions?: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 md:mb-8">
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1 rounded-control text-meta font-semibold text-blue hover:underline"
        >
          <ChevronLeft aria-hidden size={16} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-display-md md:text-display-lg">{children}</h1>
          {description && <p className="mt-1 text-meta text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/**
 * Card section (Preline "card with header and footer"). The header row holds
 * the title, an optional description and actions; tables inside the body run
 * edge to edge.
 */
export function Panel({
  title,
  description,
  actions,
  footer,
  children,
  className,
  id,
}: {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const hasHeader = Boolean(title || actions);
  return (
    <section
      id={id}
      className={cn(
        "mb-6 flex flex-col overflow-hidden rounded-card border border-border bg-white",
        className,
      )}
    >
      {hasHeader && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-meta text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5 [&>div[data-table]:first-child]:-mt-5 [&>div[data-table]:last-child]:-mb-5">
        {children}
      </div>
      {footer && (
        <div className="border-t border-border bg-surface-alt px-5 py-3 text-meta text-muted">
          {footer}
        </div>
      )}
    </section>
  );
}

/** Table in a card: runs edge to edge in a Panel and scrolls sideways on phones. */
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div data-table className="-mx-5 overflow-x-auto">
      <table
        className={cn(
          "w-full min-w-[560px] border-collapse text-left text-meta [&_tbody_tr:hover]:bg-surface-alt/60 [&_tbody_tr:last-child>td]:border-b-0",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export const th =
  "border-b border-border bg-surface-alt px-5 py-3 text-caption font-semibold tracking-wide whitespace-nowrap text-muted uppercase";
export const td = "border-b border-border px-5 py-3 align-top";

/** Footer line under a list: "12 reservas". */
export function ResultCount({ count, one, many }: { count: number; one: string; many: string }) {
  return (
    <p role="status">
      <span className="font-semibold text-ink">{count}</span> {count === 1 ? one : many}
    </p>
  );
}

/**
 * Empty list inside a card: a spot illustration (or an icon), a short title,
 * one line of help and an optional action.
 */
export function EmptyState({
  icon: Icon,
  illustration,
  title,
  children,
  action,
}: {
  icon?: LucideIcon;
  illustration?: IllustrationName;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const Art = illustration ? ILLUSTRATIONS[illustration] : null;
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      {Art ? (
        <Art className="mb-2 h-28 w-auto" />
      ) : (
        Icon && (
          <span className="mb-1 flex size-11 items-center justify-center rounded-full bg-surface-alt text-muted">
            <Icon aria-hidden size={20} />
          </span>
        )
      )}
      {title && <p className="text-base font-semibold text-ink">{title}</p>}
      <p className="max-w-sm text-meta text-muted">{children}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Preline stat card: icon, label, value and an optional hint or link. */
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-surface-alt text-navy">
        <Icon aria-hidden size={20} />
      </span>
      <span className="min-w-0">
        <span className="block text-caption font-semibold tracking-wide text-muted uppercase">
          {label}
        </span>
        <span className="mt-1 block text-display-sm text-ink">{value}</span>
        {hint && <span className="mt-0.5 block text-caption text-muted">{hint}</span>}
      </span>
    </>
  );
  const cls = "flex items-start gap-4 rounded-card border border-border bg-white p-4 md:p-5";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-border-strong")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

type Tone = "neutral" | "brand" | "accent" | "success" | "danger";
const SOFT: Record<Tone, { badge: string; dot: string }> = {
  neutral: { badge: "bg-surface-alt text-muted", dot: "bg-border-strong" },
  brand: { badge: "bg-blue/10 text-navy", dot: "bg-blue" },
  accent: { badge: "bg-yellow/25 text-ink", dot: "bg-yellow" },
  success: { badge: "bg-success/10 text-ink", dot: "bg-success" },
  danger: { badge: "bg-danger/10 text-danger", dot: "bg-danger" },
};

/** Preline soft badge with a status dot. */
export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  const s = SOFT[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-badge font-semibold whitespace-nowrap",
        s.badge,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", s.dot)} />
      {children}
    </span>
  );
}

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
  return <StatusBadge tone={BOOKING_TONES[status]}>{BOOKING_LABELS[status]}</StatusBadge>;
}

const DEP_TONES = { open: "success", sold_out: "accent", cancelled: "danger" } as const;
const DEP_LABELS = { open: "Abierta", sold_out: "Completa", cancelled: "Cancelada" };
export function DepartureStatus({ status }: { status: keyof typeof DEP_TONES }) {
  return <StatusBadge tone={DEP_TONES[status]}>{DEP_LABELS[status]}</StatusBadge>;
}

const TOUR_TONES = { draft: "neutral", published: "success", archived: "danger" } as const;
export const TOUR_LABELS = { draft: "Borrador", published: "Publicada", archived: "Archivada" };
export function TourStatus({ status }: { status: keyof typeof TOUR_TONES }) {
  return <StatusBadge tone={TOUR_TONES[status]}>{TOUR_LABELS[status]}</StatusBadge>;
}

const REQ_TONES = { new: "accent", quoted: "brand", won: "success", lost: "neutral" } as const;
export const REQUEST_LABELS = {
  new: "Nueva",
  quoted: "Presupuestada",
  won: "Ganada",
  lost: "Perdida",
};
export function RequestStatus({ status }: { status: keyof typeof REQ_TONES }) {
  return <StatusBadge tone={REQ_TONES[status]}>{REQUEST_LABELS[status]}</StatusBadge>;
}
