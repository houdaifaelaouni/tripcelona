/**
 * Business alert rules ("Avisos"): when Tripcelona should tell the owner
 * about departures, quote requests and abandoned checkouts. Each rule reads
 * as a sentence with a few editable numbers, and `evaluateRule` (pure, so it
 * runs on the server, in the browser preview and in tests) says what it
 * would flag right now plus the series drawn in the preview chart.
 *
 * Stored in `settings` under ALERT_RULES_SETTING (private, owner only).
 */

export const ALERT_RULES_SETTING = "alert_rules";

export type AlertAction = "email" | "panel";
export const ACTION_LABELS: Record<AlertAction, string> = {
  email: "avisarme por email",
  panel: "mostrarlo solo en el Panel",
};

export type AlertRule =
  | { id: "high_fill"; enabled: boolean; action: AlertAction; percent: number }
  | {
      id: "low_fill";
      enabled: boolean;
      action: AlertAction;
      days: number;
      percent: number;
    }
  | { id: "unanswered_requests"; enabled: boolean; action: AlertAction; hours: number }
  | { id: "abandoned"; enabled: boolean; action: AlertAction; count: number };

export type AlertRuleId = AlertRule["id"];

export const DEFAULT_RULES: AlertRule[] = [
  { id: "high_fill", enabled: true, action: "email", percent: 85 },
  { id: "low_fill", enabled: true, action: "email", days: 4, percent: 40 },
  { id: "unanswered_requests", enabled: true, action: "email", hours: 24 },
  { id: "abandoned", enabled: false, action: "panel", count: 5 },
];

/** Allowed range for each editable number. */
export const LIMITS = {
  percent: [1, 100],
  days: [1, 30],
  hours: [1, 168],
  count: [1, 100],
} as const;

const clamp = (v: unknown, [lo, hi]: readonly [number, number], fallback: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : fallback;
};

/** Saved value → the four rules, in order, with defaults for anything missing or invalid. */
export function rulesFromValue(value: unknown): AlertRule[] {
  const saved = (
    value && typeof value === "object" && Array.isArray((value as { rules?: unknown }).rules)
      ? (value as { rules: Record<string, unknown>[] }).rules
      : []
  ).filter((r) => r && typeof r === "object");
  return DEFAULT_RULES.map((def) => {
    const s = saved.find((r) => r.id === def.id) ?? {};
    const base = {
      enabled: typeof s.enabled === "boolean" ? s.enabled : def.enabled,
      action: (s.action === "email" || s.action === "panel" ? s.action : def.action) as AlertAction,
    };
    switch (def.id) {
      case "high_fill":
        return { ...def, ...base, percent: clamp(s.percent, LIMITS.percent, def.percent) };
      case "low_fill":
        return {
          ...def,
          ...base,
          days: clamp(s.days, LIMITS.days, def.days),
          percent: clamp(s.percent, LIMITS.percent, def.percent),
        };
      case "unanswered_requests":
        return { ...def, ...base, hours: clamp(s.hours, LIMITS.hours, def.hours) };
      case "abandoned":
        return { ...def, ...base, count: clamp(s.count, LIMITS.count, def.count) };
    }
  });
}

/** What the rules look at. Aggregates only: no customer data. */
export type AlertData = {
  now: string;
  /** Upcoming, not cancelled departures (next 60 days). */
  departures: {
    id: string;
    startsAt: string;
    capacity: number;
    seatsTaken: number;
    tour: string;
  }[];
  /** Quote requests still marked "new". */
  openRequests: { id: string; createdAt: string; label: string }[];
  /** Bookings of the last 30 days that were never paid (pending), by creation time. */
  unpaidBookings: { createdAt: string }[];
};

export type AlertHit = { key: string; text: string; href: string };
export type AlertEvaluation = {
  /** Things that match the rule right now. */
  hits: AlertHit[];
  /** Bars for the preview chart, plus which ones cross the line. */
  series: { label: string; value: number; over: boolean }[];
  threshold: number;
  unit: string;
  /** How the count of hits reads, e.g. "salidas ahora mismo". */
  summary: string;
  caption: string;
};

const TZ = "Europe/Madrid";
const HOUR = 3_600_000;
const dayLabel = (iso: string) =>
  new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: TZ }).format(
    new Date(iso),
  );
const dayKey = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
const pct = (d: { capacity: number; seatsTaken: number }) =>
  d.capacity > 0 ? Math.round((d.seatsTaken / d.capacity) * 100) : 0;

export function evaluateRule(rule: AlertRule, data: AlertData): AlertEvaluation {
  const now = Date.parse(data.now);
  switch (rule.id) {
    case "high_fill": {
      const deps = data.departures.slice(0, 24);
      const hits = data.departures
        .filter((d) => pct(d) >= rule.percent && d.seatsTaken < d.capacity)
        .map((d) => ({
          key: d.id,
          text: `${d.tour}, ${dayLabel(d.startsAt)}: ${pct(d)} % (${d.capacity - d.seatsTaken} plazas libres)`,
          href: `/admin/salidas/${d.id}`,
        }));
      return {
        hits,
        series: deps.map((d) => ({
          label: dayLabel(d.startsAt),
          value: pct(d),
          over: pct(d) >= rule.percent && d.seatsTaken < d.capacity,
        })),
        threshold: rule.percent,
        unit: "%",
        summary:
          hits.length === 1 ? "salida casi llena ahora mismo" : "salidas casi llenas ahora mismo",
        caption:
          "Ocupación de las próximas salidas, por fecha. No cuenta las que ya están completas.",
      };
    }
    case "low_fill": {
      const horizon = now + 14 * 24 * HOUR;
      const deps = data.departures.filter((d) => Date.parse(d.startsAt) <= horizon).slice(0, 24);
      const risky = (d: AlertData["departures"][number]) =>
        Date.parse(d.startsAt) - now <= rule.days * 24 * HOUR && pct(d) < rule.percent;
      const hits = data.departures.filter(risky).map((d) => ({
        key: d.id,
        text: `${d.tour}, ${dayLabel(d.startsAt)}: solo ${d.seatsTaken} de ${d.capacity} plazas (${pct(d)} %)`,
        href: `/admin/salidas/${d.id}`,
      }));
      return {
        hits,
        series: deps.map((d) => ({ label: dayLabel(d.startsAt), value: pct(d), over: risky(d) })),
        threshold: rule.percent,
        unit: "%",
        summary:
          hits.length === 1
            ? "salida con pocas plazas vendidas"
            : "salidas con pocas plazas vendidas",
        caption: `Ocupación de las salidas de los próximos 14 días. Se marcan las que salen en ${rule.days} días o menos y no llegan a la línea.`,
      };
    }
    case "unanswered_requests": {
      const reqs = [...data.openRequests]
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(0, 24);
      const age = (r: { createdAt: string }) => Math.round((now - Date.parse(r.createdAt)) / HOUR);
      const hits = data.openRequests
        .filter((r) => age(r) >= rule.hours)
        .map((r) => ({
          key: r.id,
          text: `${r.label}: sin responder desde hace ${age(r)} h`,
          href: `/admin/solicitudes/${r.id}`,
        }));
      return {
        hits,
        series: reqs.map((r) => ({
          label: dayLabel(r.createdAt),
          value: age(r),
          over: age(r) >= rule.hours,
        })),
        threshold: rule.hours,
        unit: "h",
        summary:
          hits.length === 1 ? "solicitud esperando respuesta" : "solicitudes esperando respuesta",
        caption: "Horas que lleva cada solicitud de presupuesto nueva sin respuesta.",
      };
    }
    case "abandoned": {
      const days = Array.from({ length: 30 }, (_, i) =>
        dayKey(new Date(now - (29 - i) * 24 * HOUR).toISOString()),
      );
      const counts = new Map(days.map((d) => [d, 0]));
      for (const b of data.unpaidBookings) {
        const k = dayKey(b.createdAt);
        if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
      }
      const series = days.map((d) => ({
        label: dayLabel(`${d}T12:00:00Z`),
        value: counts.get(d) ?? 0,
        over: (counts.get(d) ?? 0) > rule.count,
      }));
      const today = series.at(-1)!;
      return {
        hits: today.over
          ? [
              {
                key: days.at(-1)!,
                text: `${today.value} reservas sin pagar hoy`,
                href: "/admin/reservas?estado=pending",
              },
            ]
          : [],
        series,
        threshold: rule.count,
        unit: "",
        summary: `${series.filter((s) => s.over).length === 1 ? "día" : "días"} en los últimos 30 por encima`,
        caption: "Reservas empezadas y no pagadas, por día, últimos 30 días.",
      };
    }
  }
}

/** The headline number shown under "Habría saltado". */
export function headline(rule: AlertRule, ev: AlertEvaluation): number {
  return rule.id === "abandoned" ? ev.series.filter((s) => s.over).length : ev.hits.length;
}

/** One rule as a sentence, e.g. for the rules list and the email. */
export function ruleSentence(rule: AlertRule): string {
  const act = ACTION_LABELS[rule.action];
  switch (rule.id) {
    case "high_fill":
      return `Cuando una salida pase del ${rule.percent} % de ocupación, ${act}.`;
    case "low_fill":
      return `Cuando a una salida le queden ${rule.days} días o menos y tenga menos del ${rule.percent} % vendido, ${act}.`;
    case "unanswered_requests":
      return `Cuando una solicitud de presupuesto lleve más de ${rule.hours} h sin responder, ${act}.`;
    case "abandoned":
      return `Cuando haya más de ${rule.count} reservas sin pagar en un día, ${act}.`;
  }
}
