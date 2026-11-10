// US-23: 10 parallel checkouts on a departure with 1 seat. Exactly one gets a
// pending booking; every other caller gets a clear sold-out answer.
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connectLocalSupabase, waitForSupabaseApi } from "./local-env";

connectLocalSupabase();
await waitForSupabaseApi();
const { createAdminClient } = await import("@/lib/supabase/admin");
const { createPendingBooking } = await import("@/lib/booking/create");

const PARALLEL = 10;
const db = createAdminClient();
const slug = `checkout-race-${randomUUID().slice(0, 8)}`;
let departureId = "";

beforeAll(async () => {
  const { data: tour } = await db
    .from("tours")
    .insert({ slug, title: "Race", status: "published" })
    .select("id")
    .single();
  const { data: dep } = await db
    .from("tour_departures")
    .insert({
      tour_id: tour!.id,
      starts_at: new Date(Date.now() + 7 * 864e5).toISOString(),
      capacity: 1,
      price_cents: 5000,
    })
    .select("id")
    .single();
  departureId = dep!.id;
});

afterAll(async () => {
  await db.from("bookings").delete().eq("departure_id", departureId);
  await db.from("tours").delete().eq("slug", slug);
});

describe("checkout under concurrency", () => {
  it(`${PARALLEL} parallel checkouts for the last seat: one booking, ${PARALLEL - 1} sold out`, async () => {
    const results = await Promise.all(
      Array.from({ length: PARALLEL }, (_, i) =>
        createPendingBooking({
          departureId,
          travellers: 1,
          name: `Cliente ${i}`,
          email: `c${i}@example.com`,
          phone: "+34 600 000 000",
        }),
      ),
    );
    const wins = results.filter((r) => r.ok);
    const losses = results.filter((r) => !r.ok);
    expect(wins).toHaveLength(1);
    expect(losses).toHaveLength(PARALLEL - 1);
    for (const l of losses) {
      if (l.ok) continue;
      expect(["sold_out", "race_lost", "not_enough_seats"]).toContain(l.reason);
      expect(l.message).toMatch(/complet|últimas plazas|No quedan plazas/);
    }

    const { data: bookings } = await db
      .from("bookings")
      .select("id")
      .eq("departure_id", departureId);
    expect(bookings).toHaveLength(1);
    const { data: dep } = await db
      .from("tour_departures")
      .select("seats_taken, status")
      .eq("id", departureId)
      .single();
    expect(dep).toEqual({ seats_taken: 1, status: "sold_out" });
  });
});
