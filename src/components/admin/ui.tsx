/**
 * Admin building blocks in the Untitled UI style. Badges and featured icons
 * are the Untitled UI React components (MIT, © 2025 Untitled UI,
 * https://github.com/untitleduico/react, vendored in src/components/uui).
 * Page headers, breadcrumbs, section headers/footers, cards, tables and
 * metrics are recreated after the Untitled UI patterns with native markup,
 * so they render on the server. See THIRD_PARTY_NOTICES.md.
 */
import { ChevronRight, HomeLine } from "@untitledui/icons";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { FeaturedIcon } from "@/components/uui/foundations/featured-icon/featured-icon";
import { BadgeWithDot } from "@/components/uui/base/badges/badges";
import { cn } from "@/lib/cn";
export { EmptyState } from "./empty-state";

export type Crumb = { href?: string; label: string };

/** Breadcrumbs: home icon, chevrons, current page last (not a link). */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Migas de pan" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
        <li className="flex items-center">
          <Link
            href="/admin"
            className="flex rounded-md p-1 text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover"
          >
            <HomeLine aria-hidden className="size-5" />
            <span className="sr-only">Panel</span>
          </Link>
        </li>
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              <ChevronRight aria-hidden className="size-4 text-fg-quaternary" />
              {c.href && !last ? (
                <Link
                  href={c.href}
                  className="rounded-md px-1 py-0.5 text-tertiary hover:bg-primary_hover hover:text-tertiary_hover"
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className="rounded-md bg-primary_hover px-2 py-1 font-semibold text-fg-secondary"
                >
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Page header: breadcrumbs, title, supporting text and actions over a
 * divider (Untitled UI "page header" / section header pattern).
 */
export function PageTitle({
  children,
  actions,
  description,
  back,
  crumbs,
}: {
  children: ReactNode;
  actions?: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string };
  crumbs?: Crumb[];
}) {
  const trail = crumbs ?? (back ? [back, { label: String(children) }] : undefined);
  return (
    <header className="mb-8">
      {trail && <Breadcrumbs items={trail} />}
      <div className="flex flex-col gap-4 border-b border-secondary pb-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl leading-8 font-semibold tracking-normal text-primary md:text-3xl md:leading-9">
            {children}
          </h1>
          {description && <div className="mt-1 text-md text-tertiary">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}

/** Section header inside a page: title + supporting text + actions. */
export function SectionHeader({
  title,
  description,
  actions,
  badge,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-secondary pb-5 md:flex-row md:items-start md:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-normal text-primary">
          {title}
          {badge}
        </h2>
        {description && <p className="mt-1 text-sm text-tertiary">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

/** Section footer: supporting text left, actions right, over a divider. */
export function SectionFooter({
  children,
  actions,
}: {
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-t border-secondary pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-tertiary">{children}</div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

/**
 * Card (Untitled UI "table card" / content card): header with title, badge,
 * supporting text and actions; body; optional footer. Tables inside run
 * edge to edge.
 */
export function Panel({
  title,
  description,
  actions,
  badge,
  footer,
  children,
  className,
  id,
}: {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
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
        "mb-6 flex flex-col overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary",
        className,
      )}
    >
      {hasHeader && (
        <div className="flex flex-col gap-4 border-b border-secondary px-4 py-5 md:flex-row md:items-start md:justify-between md:px-6">
          <div className="min-w-0">
            {title && (
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-normal text-primary">
                {title}
                {badge}
              </h2>
            )}
            {description && <p className="mt-1 text-sm text-tertiary">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
      )}
      <div className="px-4 py-5 md:px-6 [&>div[data-table]:first-child]:-mt-5 [&>div[data-table]:last-child]:-mb-5">
        {children}
      </div>
      {footer && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-secondary px-4 py-3 text-sm text-tertiary md:px-6">
          {footer}
        </div>
      )}
    </section>
  );
}

/** Count badge for card headers ("12 reservas"). */
export function CountBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-brand-primary px-2 py-0.5 text-xs font-medium text-brand-secondary ring-1 ring-brand-200 ring-inset">
      {children}
    </span>
  );
}

/** Table inside a card (Untitled UI table styles): edge to edge, scrolls on phones. */
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div
      data-table
      // Focusable so the table can be scrolled sideways with the keyboard (axe).
      tabIndex={0}
      role="region"
      aria-label={props["aria-label"] ?? "Tabla"}
      className="-mx-4 overflow-x-auto outline-focus-ring focus-visible:outline-2 md:-mx-6"
    >
      <table
        className={cn(
          "w-full min-w-[560px] border-collapse text-left text-sm [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-secondary [&_tbody_tr:last-child>td]:border-b-0",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export const th =
  "h-11 border-b border-secondary bg-secondary px-4 py-3 text-xs font-semibold whitespace-nowrap text-quaternary first:pl-4 md:px-6";
export const td = "border-b border-secondary px-4 py-4 align-middle text-sm text-tertiary md:px-6";

/** Footer line under a list: "12 reservas". */
export function ResultCount({ count, one, many }: { count: number; one: string; many: string }) {
  return (
    <p role="status" className="text-sm text-tertiary">
      <span className="font-semibold text-secondary">{count}</span> {count === 1 ? one : many}
    </p>
  );
}

/** Untitled UI metric card: featured icon, label, big number, optional trend and link. */
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
  trend,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  trend?: { value: string; up: boolean };
}) {
  const body = (
    <>
      <div className="flex items-center gap-3">
        <FeaturedIcon icon={Icon} color="gray" theme="modern" size="md" />
        <span className="text-sm font-medium text-tertiary">{label}</span>
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-2">
        <span className="text-3xl leading-9 font-semibold text-primary">{value}</span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset",
              trend.up
                ? "bg-utility-success-50 text-utility-success-700 ring-utility-success-200"
                : "bg-utility-error-50 text-utility-error-700 ring-utility-error-200",
            )}
          >
            {trend.up ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
      {hint && <p className="mt-2 text-sm text-tertiary">{hint}</p>}
    </>
  );
  const cls = "flex flex-col rounded-xl bg-primary p-5 shadow-xs ring-1 ring-secondary md:p-6";
  return href ? (
    <Link href={href} className={cn(cls, "transition-shadow hover:shadow-md")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

type Tone = "neutral" | "brand" | "accent" | "success" | "danger";
const BADGE_COLOR = {
  neutral: "gray",
  brand: "brand",
  accent: "warning",
  success: "success",
  danger: "error",
} as const;

/** Untitled UI pill badge with a status dot. */
export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <BadgeWithDot type="pill-color" size="sm" color={BADGE_COLOR[tone]}>
      {children}
    </BadgeWithDot>
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

/** Untitled UI progress bar (label + percentage). */
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Ocupación"}
        className="h-2 w-full min-w-16 overflow-hidden rounded-md bg-quaternary"
      >
        <div className="h-full rounded-md bg-fg-brand-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-sm font-medium text-secondary tabular-nums">{pct}%</span>
    </div>
  );
}

/**
 * Vertical progress steps (recreated after Untitled UI "progress steps"):
 * numbered circles joined by a line, title and short help per step. Here
 * each step links to its section of a single-page form.
 */
export function ProgressSteps({
  steps,
}: {
  steps: { id: string; title: string; description: string }[];
}) {
  return (
    <ol className="flex flex-col">
      {steps.map((s, i) => (
        <li key={s.id} className="relative flex gap-3 pb-6 last:pb-0">
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className="absolute top-9 bottom-1 left-4 w-0.5 rounded-full bg-quaternary"
            />
          )}
          <a
            href={`#${s.id}`}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-solid text-sm font-semibold text-white ring-4 ring-brand-100"
          >
            {i + 1}
          </a>
          <div className="pt-1">
            <p className="text-sm font-semibold text-secondary">{s.title}</p>
            <p className="text-sm text-tertiary">{s.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
