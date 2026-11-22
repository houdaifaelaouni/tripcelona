"use client";

/**
 * Month calendar of departures (layout after the shadcn.io "Content calendar"
 * dashboard block): filter chips, a Monday-first month grid where each day
 * lists its departures, and a side panel with the selected departure.
 * Phones get an agenda list instead of the grid.
 */
import {
  BusIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  ExternalLinkIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DepartureStatus } from "@/components/admin/ui";
import { cx } from "@/components/uui/utils/cx";

export type CalendarDeparture = {
  id: string;
  startsAt: string;
  capacity: number;
  seatsTaken: number;
  status: "open" | "sold_out" | "cancelled";
  priceCents: number;
  tourId: string;
  tourTitle: string;
};

type Filter = "all" | "open" | "sold_out" | "cancelled";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "open", label: "Abiertas" },
  { id: "sold_out", label: "Completas" },
  { id: "cancelled", label: "Canceladas" },
];
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MAX_PER_DAY = 3;
const TZ = "Europe/Madrid";

const dayKey = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
const time = (iso: string) =>
  new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(
    new Date(iso),
  );
const longDate = (iso: string) =>
  new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).format(new Date(iso));
const euros = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);
const pad = (n: number) => String(n).padStart(2, "0");

function monthParam(year: number, month: number) {
  const d = new Date(Date.UTC(year, month - 1, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

/** Monday of the week that holds `key` (YYYY-MM-DD), as a key. */
function weekOf(key: string) {
  const d = new Date(`${key}T12:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

export function DeparturesCalendar({
  departures,
  year,
  month,
  canSeePassengers,
  basePath = "/admin",
}: {
  departures: CalendarDeparture[];
  /** Full year, e.g. 2026. */
  year: number;
  /** 1-12. */
  month: number;
  /** Owners can open the passenger list of a departure. */
  canSeePassengers: boolean;
  basePath?: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const today = dayKey(new Date().toISOString());
  const visible = useMemo(
    () => departures.filter((d) => filter === "all" || d.status === filter),
    [departures, filter],
  );
  const firstUpcoming =
    visible.find((d) => dayKey(d.startsAt) >= today && d.status !== "cancelled") ?? visible[0];
  const [selectedId, setSelectedId] = useState<string | null>(firstUpcoming?.id ?? null);
  const selected = visible.find((d) => d.id === selectedId) ?? firstUpcoming ?? null;

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarDeparture[]>();
    for (const d of visible) {
      const k = dayKey(d.startsAt);
      map.set(k, [...(map.get(k) ?? []), d]);
    }
    return map;
  }, [visible]);

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${year}-${pad(month)}-${pad(i + 1)}`),
  ];
  while (cells.length % 7) cells.push(null);

  const monthName = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 15)));
  const counts = {
    open: departures.filter((d) => d.status === "open").length,
    sold_out: departures.filter((d) => d.status === "sold_out").length,
    cancelled: departures.filter((d) => d.status === "cancelled").length,
  };
  const live = departures.filter((d) => d.status !== "cancelled");
  const seatsTaken = live.reduce((n, d) => n + d.seatsTaken, 0);
  const seatsTotal = live.reduce((n, d) => n + d.capacity, 0);

  const week = selected ? weekOf(dayKey(selected.startsAt)) : null;
  const sameWeek = week ? departures.filter((d) => weekOf(dayKey(d.startsAt)) === week) : [];

  const nav = (delta: number) => `${basePath}?mes=${monthParam(year, month + delta)}#calendario`;

  const chip = (d: CalendarDeparture, wide = false) => {
    const active = selected?.id === d.id;
    return (
      <button
        key={d.id}
        type="button"
        onClick={() => setSelectedId(d.id)}
        aria-pressed={active}
        title={`${d.tourTitle} · ${time(d.startsAt)} · ${d.seatsTaken}/${d.capacity} plazas`}
        className={cx(
          "flex w-full min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs font-medium outline-focus-ring ring-1 transition ring-inset focus-visible:outline-2 focus-visible:outline-offset-1",
          active
            ? "bg-brand-solid text-white ring-transparent"
            : "bg-primary text-secondary ring-secondary hover:bg-primary_hover",
          d.status === "cancelled" && !active && "text-quaternary line-through",
          wide && "py-2 text-sm",
        )}
      >
        <span
          aria-hidden
          className={cx(
            "size-1.5 shrink-0 rounded-full",
            d.status === "open" && "bg-fg-success-secondary",
            d.status === "sold_out" && "bg-fg-warning-secondary",
            d.status === "cancelled" && "bg-fg-error-secondary",
            active && "bg-white",
          )}
        />
        <span className="truncate">{d.tourTitle}</span>
        {wide && (
          <span
            className={cx(
              "ml-auto shrink-0 tabular-nums",
              active ? "text-white/80" : "text-tertiary",
            )}
          >
            {time(d.startsAt)} · {d.seatsTaken}/{d.capacity}
          </span>
        )}
      </button>
    );
  };

  return (
    <section
      id="calendario"
      aria-label="Calendario de salidas"
      className="mb-6 scroll-mt-20 overflow-hidden rounded-xl bg-primary ring-1 ring-secondary"
    >
      <div className="flex flex-col gap-3 border-b border-secondary px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
        <div>
          <h2 className="text-md font-semibold tracking-tight text-primary">
            Calendario de salidas
          </h2>
          <p className="mt-0.5 text-sm text-tertiary">
            Todas las fechas del mes. Pulsa una salida para ver sus plazas y abrirla.
          </p>
        </div>
        <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cx(
                "rounded-md px-2.5 py-1 text-sm font-medium outline-focus-ring ring-1 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2",
                filter === f.id
                  ? "bg-brand-solid text-white ring-transparent"
                  : "bg-primary text-secondary ring-secondary hover:bg-primary_hover",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 lg:border-r lg:border-secondary">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-secondary px-4 py-3 md:px-5">
            <div className="flex items-center gap-1">
              <Link
                href={nav(-1)}
                scroll={false}
                aria-label="Mes anterior"
                className="inline-flex size-8 items-center justify-center rounded-md text-fg-quaternary hover:bg-primary_hover hover:text-fg-secondary"
              >
                <ChevronLeftIcon aria-hidden className="size-4" />
              </Link>
              <span className="min-w-36 text-center text-sm font-semibold text-primary first-letter:uppercase">
                {monthName}
              </span>
              <Link
                href={nav(1)}
                scroll={false}
                aria-label="Mes siguiente"
                className="inline-flex size-8 items-center justify-center rounded-md text-fg-quaternary hover:bg-primary_hover hover:text-fg-secondary"
              >
                <ChevronRightIcon aria-hidden className="size-4" />
              </Link>
            </div>
            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-tertiary">
              <div className="flex items-center gap-1.5">
                <span aria-hidden className="size-1.5 rounded-full bg-fg-success-secondary" />
                <dt>Abiertas</dt>
                <dd className="font-medium text-secondary tabular-nums">{counts.open}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <span aria-hidden className="size-1.5 rounded-full bg-fg-warning-secondary" />
                <dt>Completas</dt>
                <dd className="font-medium text-secondary tabular-nums">{counts.sold_out}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <span aria-hidden className="size-1.5 rounded-full bg-fg-error-secondary" />
                <dt>Canceladas</dt>
                <dd className="font-medium text-secondary tabular-nums">{counts.cancelled}</dd>
              </div>
            </dl>
          </div>

          {/* Month grid (tablet and up) */}
          <div className="hidden md:block">
            <div className="grid grid-cols-7 border-b border-secondary bg-secondary">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-2 text-center text-xs font-medium text-tertiary">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((key, i) => {
                const list = key ? (byDay.get(key) ?? []) : [];
                const day = key ? Number(key.slice(-2)) : null;
                const taken = list
                  .filter((d) => d.status !== "cancelled")
                  .reduce((n, d) => n + d.seatsTaken, 0);
                const total = list
                  .filter((d) => d.status !== "cancelled")
                  .reduce((n, d) => n + d.capacity, 0);
                return (
                  <div
                    key={key ?? `empty-${i}`}
                    className={cx(
                      "min-h-28 border-b border-secondary p-1.5 [&:not(:nth-child(7n))]:border-r",
                      !key && "bg-secondary/50",
                    )}
                  >
                    {key && (
                      <>
                        <div className="mb-1 flex items-center justify-between px-0.5">
                          <span
                            className={cx(
                              "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                              key === today ? "bg-brand-solid text-white" : "text-secondary",
                            )}
                          >
                            {day}
                          </span>
                          {total > 0 && (
                            <span
                              className="text-[11px] text-quaternary tabular-nums"
                              title="Plazas vendidas / plazas"
                            >
                              {taken}/{total}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          {list.slice(0, MAX_PER_DAY).map((d) => chip(d))}
                          {list.length > MAX_PER_DAY && (
                            <span className="px-1 text-[11px] text-tertiary">
                              +{list.length - MAX_PER_DAY} más
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agenda (phones) */}
          <ul className="divide-y divide-secondary md:hidden">
            {[...byDay.entries()].map(([key, list]) => (
              <li key={key} className="px-4 py-3">
                <p
                  className={cx(
                    "mb-2 text-xs font-medium first-letter:uppercase",
                    key === today ? "text-brand-secondary" : "text-tertiary",
                  )}
                >
                  {longDate(`${key}T12:00:00Z`)}
                </p>
                <div className="flex flex-col gap-1.5">{list.map((d) => chip(d, true))}</div>
              </li>
            ))}
            {byDay.size === 0 && (
              <li className="px-4 py-8 text-center text-sm text-tertiary">Sin salidas este mes.</li>
            )}
          </ul>

          <p className="border-t border-secondary bg-secondary px-4 py-3 text-sm text-tertiary md:border-t-0 md:px-5">
            {departures.length} {departures.length === 1 ? "salida" : "salidas"} este mes ·{" "}
            {seatsTaken} de {seatsTotal} plazas vendidas.
          </p>
        </div>

        <aside
          aria-label="Salida seleccionada"
          className="border-t border-secondary p-4 md:p-5 lg:border-t-0"
        >
          {selected ? (
            <div className="flex h-full flex-col gap-5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-tertiary">Salida</span>
                  <DepartureStatus status={selected.status} />
                </div>
                <p className="mt-3 text-lg leading-snug font-semibold text-primary">
                  {selected.tourTitle}
                </p>
              </div>
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-tertiary">
                    <CalendarDaysIcon aria-hidden className="size-4 text-fg-quaternary" /> Fecha
                  </dt>
                  <dd className="font-medium text-primary first-letter:uppercase">
                    {longDate(selected.startsAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-tertiary">
                    <ClockIcon aria-hidden className="size-4 text-fg-quaternary" /> Hora
                  </dt>
                  <dd className="font-medium text-primary tabular-nums">
                    {time(selected.startsAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-tertiary">
                    <BusIcon aria-hidden className="size-4 text-fg-quaternary" /> Precio
                  </dt>
                  <dd className="font-medium text-primary tabular-nums">
                    {euros(selected.priceCents)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-tertiary">
                    <UsersIcon aria-hidden className="size-4 text-fg-quaternary" /> Plazas
                  </dt>
                  <dd className="font-medium text-primary tabular-nums">
                    {selected.seatsTaken} / {selected.capacity}
                  </dd>
                </div>
              </dl>
              <div className="-mt-3">
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-tertiary"
                  role="progressbar"
                  aria-label="Ocupación"
                  aria-valuenow={Math.round(
                    (selected.seatsTaken / Math.max(selected.capacity, 1)) * 100,
                  )}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-brand-solid"
                    style={{
                      width: `${Math.min(100, (selected.seatsTaken / Math.max(selected.capacity, 1)) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-tertiary">
                  {Math.max(selected.capacity - selected.seatsTaken, 0)} plazas libres
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {canSeePassengers && (
                  <Link
                    href={`/admin/salidas/${selected.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-solid px-3.5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-brand-solid_hover"
                  >
                    <UsersIcon aria-hidden className="size-4" /> Pasajeros y embarque
                  </Link>
                )}
                <Link
                  href={`/admin/excursiones/${selected.tourId}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-secondary shadow-xs ring-1 ring-primary ring-inset hover:bg-primary_hover"
                >
                  <ExternalLinkIcon aria-hidden className="size-4" /> Ficha de la excursión
                </Link>
              </div>
              <div className="border-t border-secondary pt-4">
                <p className="mb-2 text-xs font-medium text-tertiary">Misma semana</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  {[
                    ["Salidas", sameWeek.length],
                    ["Abiertas", sameWeek.filter((d) => d.status === "open").length],
                    ["Completas", sameWeek.filter((d) => d.status === "sold_out").length],
                    [
                      "Plazas libres",
                      sameWeek
                        .filter((d) => d.status !== "cancelled")
                        .reduce((n, d) => n + Math.max(d.capacity - d.seatsTaken, 0), 0),
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <dt className="text-tertiary">{label}</dt>
                      <dd className="font-medium text-primary tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
              <CalendarDaysIcon aria-hidden className="size-6 text-fg-quaternary" />
              <p className="text-sm font-medium text-primary">Sin salidas</p>
              <p className="text-sm text-tertiary">
                Añade fechas desde la ficha de cada excursión.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
