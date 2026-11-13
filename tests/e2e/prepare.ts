/**
 * Data for the e2e suite (US-35). Run before `next build`, because tour pages
 * are prerendered with their departures:
 *
 *   pnpm e2e:prepare && pnpm build && pnpm e2e
 *
 * Idempotent: ensures one open departure about 30 days ahead on the Rupit tour, an
 * owner account for the admin test, and clears form rate limits.
 */
import { connectLocalSupabase, waitForSupabaseApi } from "../db/local-env";
import { E2E, e2eOwnerPassword } from "./constants";

async function main() {
  connectLocalSupabase();
  await waitForSupabaseApi();
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { grantStaff } = await import("@/lib/admin/staff-admin");
  const db = createAdminClient();

  const { data: tour, error } = await db
    .from("tours")
    .select("id")
    .eq("slug", E2E.tourSlug)
    .single();
  if (error || !tour) throw new Error(`Tour ${E2E.tourSlug} not found: run pnpm db:reset`);

  // Reuse a future e2e departure (earlier runs may hold bookings on it).
  const { data: existing } = await db
    .from("tour_departures")
    .select("id")
    .eq("tour_id", tour.id)
    .eq("notes", E2E.departureNote)
    .gt("starts_at", new Date(Date.now() + 7 * 86_400_000).toISOString())
    .limit(1);
  if (!existing?.length) {
    const start = new Date(Date.now() + 30 * 86_400_000);
    start.setUTCHours(7, 0, 0, 0);
    const { error: depError } = await db.from("tour_departures").insert({
      tour_id: tour.id,
      starts_at: start.toISOString(),
      ends_at: new Date(start.getTime() + 11 * 3_600_000).toISOString(),
      capacity: 40,
      price_cents: 5500,
      notes: E2E.departureNote,
    });
    if (depError) throw new Error(depError.message);
  }

  // A second date, so the cart test can hold two excursions at once.
  const secondNote = `${E2E.departureNote} 2`;
  const { data: second } = await db
    .from("tour_departures")
    .select("id")
    .eq("tour_id", tour.id)
    .eq("notes", secondNote)
    .gt("starts_at", new Date(Date.now() + 7 * 86_400_000).toISOString())
    .limit(1);
  if (!second?.length) {
    const start = new Date(Date.now() + 33 * 86_400_000);
    start.setUTCHours(7, 0, 0, 0);
    const { error: depError } = await db.from("tour_departures").insert({
      tour_id: tour.id,
      starts_at: start.toISOString(),
      ends_at: new Date(start.getTime() + 11 * 3_600_000).toISOString(),
      capacity: 40,
      price_cents: 5500,
      notes: secondNote,
    });
    if (depError) throw new Error(depError.message);
  }

  // Earlier runs book seats on these dates; start every run with them empty.
  await db.from("seat_holds").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await db
    .from("tour_departures")
    .update({ seats_taken: 0, status: "open" })
    .like("notes", `${E2E.departureNote}%`);

  const { userId } = await grantStaff(E2E.ownerEmail, "owner", { password: e2eOwnerPassword() });
  // grantStaff keeps an existing account's password; the e2e owner always gets the current one.
  const { error: pwError } = await db.auth.admin.updateUserById(userId, {
    password: e2eOwnerPassword(),
  });
  if (pwError) throw new Error(pwError.message);
  await db.from("form_rate_limits").delete().neq("key", "");
  console.log("e2e data ready");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
