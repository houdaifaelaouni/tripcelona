import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ALERT_RULES_SETTING,
  evaluateRule,
  rulesFromValue,
  type AlertData,
  type AlertEvaluation,
  type AlertRule,
} from "./alert-rules";

const DAY = 24 * 3_600_000;

/** What the alert rules look at, read with the service role. No customer names or emails. */
export async function loadAlertData(db: SupabaseClient, now = new Date()): Promise<AlertData> {
  const iso = (ms: number) => new Date(ms).toISOString();
  const t = now.getTime();
  const [{ data: deps }, { data: reqs }, { data: unpaid }] = await Promise.all([
    db
      .from("tour_departures")
      .select("id, starts_at, capacity, seats_taken, tours(title)")
      .neq("status", "cancelled")
      .gte("starts_at", now.toISOString())
      .lte("starts_at", iso(t + 60 * DAY))
      .order("starts_at")
      .limit(200),
    db
      .from("tour_requests")
      .select("id, created_at, group_size, tours(title)")
      .eq("status", "new")
      .order("created_at")
      .limit(200),
    db
      .from("bookings")
      .select("created_at")
      .eq("status", "pending")
      .gte("created_at", iso(t - 30 * DAY))
      // A checkout started in the last half hour may still be paid.
      .lte("created_at", iso(t - 30 * 60_000))
      .limit(2000),
  ]);
  const title = (v: unknown) => {
    const one = Array.isArray(v) ? v[0] : v;
    return (one as { title?: string } | null)?.title ?? null;
  };
  return {
    now: now.toISOString(),
    departures: (deps ?? []).map((d) => ({
      id: d.id as string,
      startsAt: d.starts_at as string,
      capacity: d.capacity as number,
      seatsTaken: d.seats_taken as number,
      tour: title(d.tours) ?? "Excursión",
    })),
    openRequests: (reqs ?? []).map((r) => {
      const tour = title(r.tours);
      const size = r.group_size ? `${r.group_size} personas` : "grupo";
      return {
        id: r.id as string,
        createdAt: r.created_at as string,
        label: `Presupuesto para ${size}${tour ? ` (${tour})` : ""}`,
      };
    }),
    unpaidBookings: (unpaid ?? []).map((b) => ({ createdAt: b.created_at as string })),
  };
}

export async function loadAlertRules(db: SupabaseClient): Promise<AlertRule[]> {
  const { data } = await db
    .from("settings")
    .select("value")
    .eq("key", ALERT_RULES_SETTING)
    .maybeSingle();
  return rulesFromValue(data?.value);
}

/** Enabled rules that match something right now. */
export function firingRules(rules: AlertRule[], data: AlertData) {
  return rules
    .filter((r) => r.enabled)
    .map((rule) => ({ rule, ev: evaluateRule(rule, data) }))
    .filter((x): x is { rule: AlertRule; ev: AlertEvaluation } => x.ev.hits.length > 0);
}
