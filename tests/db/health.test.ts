// The health report's queries against the real schema (US-41).
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { connectLocalSupabase, waitForSupabaseApi } from "./local-env";

connectLocalSupabase();
await waitForSupabaseApi();
const { createAdminClient } = await import("@/lib/supabase/admin");
const { assessHealth, loadHealthInput } = await import("@/lib/ops/health");

const db = createAdminClient();
const slug = `health-${randomUUID().slice(0, 8)}`;
let tourId = "";

afterAll(async () => {
  const { data: deps } = await db.from("tour_departures").select("id").eq("tour_id", tourId);
  const depIds = (deps ?? []).map((d) => d.id);
  const { data: bookings } = await db.from("bookings").select("id").in("departure_id", depIds);
  const ids = (bookings ?? []).map((b) => b.id);
  await db.from("seat_holds").delete().in("departure_id", depIds);
  await db.from("payments").delete().in("booking_id", ids);
  await db.from("bookings").delete().in("id", ids);
  await db.from("tours").delete().eq("id", tourId);
});

describe("health report on the database", () => {
  it("finds stale seat holds and card payments without a confirmation email", async () => {
    const { data: tour } = await db
      .from("tours")
      .insert({ slug, title: "Health", status: "published" })
      .select("id")
      .single();
    tourId = tour!.id;
    const { data: dep } = await db
      .from("tour_departures")
      .insert({
        tour_id: tourId,
        starts_at: new Date(Date.now() + 20 * 86_400_000).toISOString(),
        capacity: 10,
        price_cents: 5000,
      })
      .select("id")
      .single();
    const { data: booking } = await db
      .from("bookings")
      .insert({
        departure_id: dep!.id,
        customer_name: "Salud",
        email: `${slug}@example.com`,
        travellers: 1,
        total_cents: 5000,
        status: "paid",
      })
      .select("id, reference")
      .single();
    await db.from("payments").insert({
      booking_id: booking!.id,
      provider: "redsys",
      provider_ref: `H${Date.now()}`.slice(0, 12),
      amount_cents: 5000,
      status: "succeeded",
    });
    // A real hold (seats counted) expiring in 2 minutes: not yet released by
    // pg_cron, but stale for a report evaluated 15 minutes from now.
    const { data: holdId, error: holdError } = await db.rpc("hold_seats", {
      p_departure_id: dep!.id,
      p_qty: 1,
    });
    expect(holdError).toBeNull();
    await db
      .from("seat_holds")
      .update({ expires_at: new Date(Date.now() + 2 * 60_000).toISOString() })
      .eq("id", holdId as string);

    // Evaluate as if 15 minutes had passed, so the payment counts as settled.
    const later = new Date(Date.now() + 15 * 60_000);
    const report = assessHealth(await loadHealthInput(db, 24, later));
    expect(report.status).toBe("critical");
    const titles = report.alerts.map((a) => a.title);
    expect(titles).toContain("Las plazas retenidas no se liberan");
    const missing = report.alerts.find((a) => a.title.startsWith("Reservas pagadas"));
    expect(missing?.refs).toContain(booking!.reference);
  });
});
