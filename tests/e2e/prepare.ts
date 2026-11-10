/**
 * Data for the e2e suite (US-35). Run before `next build`, because tour pages
 * are prerendered with their departures:
 *
 *   pnpm e2e:prepare && pnpm build && pnpm e2e
 *
 * Idempotent: adds one open departure 30 days ahead on the Rupit tour, an
 * owner account for the admin test, and clears form rate limits.
 */
import { connectLocalSupabase, waitForSupabaseApi } from "../db/local-env";
import { E2E } from "./constants";

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

  await db.from("tour_departures").delete().eq("notes", E2E.departureNote).eq("seats_taken", 0);
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

  await grantStaff(E2E.ownerEmail, "owner", { password: E2E.ownerPassword });
  await db.from("form_rate_limits").delete().neq("key", "");
  console.log("e2e data ready");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
