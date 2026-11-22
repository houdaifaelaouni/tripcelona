"use client";

/**
 * Tours ranked by sales (layout after the shadcn.io "Content performance"
 * dashboard block): a table with a revenue bar per tour and, beside it, how
 * full each departure of the selected tour is (upcoming or past).
 */
import { useState } from "react";
import { cx } from "@/components/uui/utils/cx";

export type TourPerf = {
  id: string;
  title: string;
  revenueCents: number;
  bookings: number;
  travellers: number;
  departures: {
    id: string;
    startsAt: string;
    capacity: number;
    seatsTaken: number;
    status: "open" | "sold_out" | "cancelled";
  }[];
};

const TZ = "Europe/Madrid";
const euros = (cents: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).format(new Date(iso));
const pct = (taken: number, cap: number) => (cap > 0 ? Math.round((taken / cap) * 100) : 0);

function fillLabel(p: number | null) {
  if (p === null) return { text: "Sin fechas", tone: "bg-fg-quaternary" };
  if (p >= 75) return { text: "Alta", tone: "bg-fg-success-secondary" };
  if (p >= 40) return { text: "Media", tone: "bg-fg-warning-secondary" };
  return { text: "Baja", tone: "bg-fg-error-secondary" };
}

export function TourPerformance({ tours, days }: { tours: TourPerf[]; days: number }) {
  const [selectedId, setSelectedId] = useState(tours[0]?.id ?? null);
  const [view, setView] = useState<"next" | "past">("next");
  const now = new Date().toISOString();
  const max = Math.max(...tours.map((t) => t.revenueCents), 1);
  const total = tours.reduce((n, t) => n + t.revenueCents, 0);
  const selected = tours.find((t) => t.id === selectedId) ?? tours[0];

  const upcomingFill = (t: TourPerf) => {
    const live = t.departures.filter((d) => d.startsAt >= now && d.status !== "cancelled");
    const cap = live.reduce((n, d) => n + d.capacity, 0);
    return cap
      ? pct(
          live.reduce((n, d) => n + d.seatsTaken, 0),
          cap,
        )
      : null;
  };

  const list = selected
    ? (view === "next"
        ? selected.departures.filter((d) => d.startsAt >= now)
        : selected.departures.filter((d) => d.startsAt < now).reverse()
      ).slice(0, 6)
    : [];
  const live = list.filter((d) => d.status !== "cancelled");
  const avg = live.length
    ? Math.round(live.reduce((n, d) => n + pct(d.seatsTaken, d.capacity), 0) / live.length)
    : null;
  const full = live.filter((d) => d.seatsTaken >= d.capacity).length;

  return (
    <section
      aria-label="Excursiones por ventas"
      className="mb-6 overflow-hidden rounded-xl bg-primary ring-1 ring-secondary"
    >
      <div className="flex flex-col gap-1 border-b border-secondary px-4 py-4 md:px-5">
        <h2 className="text-md font-semibold tracking-tight text-primary">
          Qué excursiones venden más
        </h2>
        <p className="text-sm text-tertiary">
          Reservas pagadas de los últimos {days} días, {euros(total)} en total. Pulsa una excursión
          para ver cómo se llenan sus salidas.
        </p>
      </div>
      <div className="grid xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 overflow-x-auto xl:border-r xl:border-secondary">
          <div className="flex items-center justify-between border-b border-secondary px-4 py-3 md:px-5">
            <span className="text-sm font-semibold text-primary">Excursiones por ingresos</span>
            <span className="text-xs text-tertiary">
              {tours.length} {tours.length === 1 ? "excursión" : "excursiones"}
            </span>
          </div>
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-secondary text-left text-xs font-medium text-tertiary">
                <th className="px-4 py-2.5 font-medium md:px-5">Excursión</th>
                <th className="px-3 py-2.5 font-medium">Ingresos</th>
                <th className="px-3 py-2.5 text-right font-medium">Reservas</th>
                <th className="px-3 py-2.5 text-right font-medium">Viajeros</th>
                <th className="px-3 py-2.5 text-right font-medium">Ticket medio</th>
                <th className="px-4 py-2.5 text-right font-medium md:px-5">Ocupación</th>
              </tr>
            </thead>
            <tbody>
              {tours.map((t) => {
                const active = t.id === selected?.id;
                const fill = upcomingFill(t);
                const label = fillLabel(fill);
                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={cx(
                      "cursor-pointer border-b border-secondary align-top transition last:border-b-0",
                      active ? "bg-secondary" : "hover:bg-primary_hover",
                    )}
                  >
                    <td className="px-4 py-3 md:px-5">
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(t.id);
                        }}
                        className="text-left font-medium text-primary outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                      >
                        {t.title}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-medium text-primary tabular-nums">
                        {euros(t.revenueCents)}
                      </span>
                      <span aria-hidden className="mt-1.5 block h-1 w-24 rounded-full bg-tertiary">
                        <span
                          className="block h-full rounded-full bg-brand-solid"
                          style={{ width: `${(t.revenueCents / max) * 100}%` }}
                        />
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-secondary tabular-nums">
                      {t.bookings}
                    </td>
                    <td className="px-3 py-3 text-right text-secondary tabular-nums">
                      {t.travellers}
                    </td>
                    <td className="px-3 py-3 text-right text-secondary tabular-nums">
                      {euros(t.bookings ? t.revenueCents / t.bookings : 0)}
                    </td>
                    <td className="px-4 py-3 text-right md:px-5">
                      <span className="font-medium text-primary tabular-nums">
                        {fill === null ? "–" : `${fill} %`}
                      </span>
                      <span className="flex items-center justify-end gap-1.5 text-xs text-tertiary">
                        <span aria-hidden className={cx("size-1.5 rounded-full", label.tone)} />
                        {label.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <aside
          aria-label="Ocupación por salida"
          className="border-t border-secondary p-4 md:p-5 xl:border-t-0"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-primary">Ocupación</span>
            <div role="group" aria-label="Qué salidas" className="flex gap-1.5">
              {(
                [
                  ["next", "Próximas"],
                  ["past", "Pasadas"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={view === id}
                  onClick={() => setView(id)}
                  className={cx(
                    "rounded-md px-2.5 py-1 text-xs font-medium ring-1 outline-focus-ring ring-inset focus-visible:outline-2 focus-visible:outline-offset-2",
                    view === id
                      ? "bg-brand-solid text-white ring-transparent"
                      : "bg-primary text-secondary ring-secondary hover:bg-primary_hover",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {selected && (
            <>
              <p className="mt-3 text-sm font-medium text-primary">{selected.title}</p>
              <div className="mt-4 rounded-lg bg-secondary p-3 ring-1 ring-secondary ring-inset">
                {list.length ? (
                  <ul className="divide-y divide-secondary">
                    {list.map((d) => {
                      const p = pct(d.seatsTaken, d.capacity);
                      return (
                        <li
                          key={d.id}
                          className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                        >
                          <div className="min-w-0 flex-1">
                            <p
                              className={cx(
                                "truncate text-sm text-secondary first-letter:uppercase",
                                d.status === "cancelled" && "text-quaternary line-through",
                              )}
                            >
                              {shortDate(d.startsAt)}
                            </p>
                            <p className="text-xs text-tertiary tabular-nums">
                              {d.seatsTaken} / {d.capacity} plazas
                            </p>
                          </div>
                          <div className="w-20 shrink-0 text-right">
                            <span className="text-xs font-medium text-primary tabular-nums">
                              {d.status === "cancelled" ? "Cancelada" : `${p} %`}
                            </span>
                            <span aria-hidden className="mt-1 block h-1.5 rounded-full bg-tertiary">
                              <span
                                className={cx(
                                  "block h-full rounded-full",
                                  d.status === "cancelled" ? "bg-transparent" : "bg-brand-solid",
                                )}
                                style={{ width: `${Math.min(p, 100)}%` }}
                              />
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="py-6 text-center text-sm text-tertiary">
                    {view === "next" ? "Sin salidas programadas." : "Sin salidas recientes."}
                  </p>
                )}
              </div>
              {avg !== null && (
                <p className="mt-3 text-xs leading-5 text-tertiary">
                  {selected.title}: las {view === "next" ? "próximas" : "últimas"} {live.length}{" "}
                  salidas van al {avg} % de media
                  {full ? `, y ${full} ${full === 1 ? "está llena" : "están llenas"}` : ""}.
                </p>
              )}
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
