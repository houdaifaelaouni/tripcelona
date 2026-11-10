import "server-only";
import { connection } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import type { Departure } from "@/lib/tours/types";
import type { QuotableDeparture } from "./quote";

/**
 * Live (uncached) availability. Seats change with every booking, so the
 * picker and checkout read them per request (PRD §9.2).
 */
export async function getLiveDepartures(tourSlug: string): Promise<Departure[]> {
  await connection();
  const { data, error } = await createPublicClient()
    .from("tour_departures")
    .select("id, starts_at, ends_at, capacity, seats_taken, price_cents, status, tours!inner(slug)")
    .eq("tours.slug", tourSlug)
    .gt("starts_at", new Date().toISOString())
    .neq("status", "cancelled")
    .order("starts_at");
  if (error) throw new Error(`Failed to load departures: ${error.message}`);
  return (data ?? []).map((d) => ({
    id: d.id,
    startsAt: d.starts_at,
    endsAt: d.ends_at,
    seatsLeft: Math.max(d.capacity - d.seats_taken, 0),
    priceCents: d.price_cents,
    status: d.status,
  }));
}

export type CheckoutDeparture = QuotableDeparture & {
  id: string;
  endsAt: string | null;
  tour: { slug: string; title: string; area: string | null; meetingPoint: string | null };
};

/** One departure with its tour, for the checkout page and action. */
export async function getCheckoutDeparture(id: string): Promise<CheckoutDeparture | null> {
  await connection();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await createPublicClient()
    .from("tour_departures")
    .select(
      "id, starts_at, ends_at, capacity, seats_taken, price_cents, status, tours!inner(slug, title, area, meeting_point, status)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load departure: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    capacity: data.capacity,
    seatsTaken: data.seats_taken,
    priceCents: data.price_cents,
    status: data.status,
    tourPublished: data.tours.status === "published",
    tour: {
      slug: data.tours.slug,
      title: data.tours.title,
      area: data.tours.area,
      meetingPoint: data.tours.meeting_point,
    },
  };
}
