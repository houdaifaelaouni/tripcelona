import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { QUOTE_ERRORS, quoteDeparture, type Quote } from "./quote";

const HOLD_TTL = "15 minutes";

export type NewBooking = {
  departureId: string;
  travellers: number;
  name: string;
  email: string;
  phone: string;
  pickupNote?: string;
  /** Set when the booking belongs to a cart that is paid in one go. */
  cartId?: string;
};

export type CreateBookingResult =
  | { ok: true; bookingId: string; reference: string; holdId: string; totalCents: number }
  | {
      ok: false;
      reason: Exclude<Quote, { ok: true }>["reason"] | "not_found" | "race_lost";
      message: string;
      seatsLeft?: number;
    };

export const RACE_LOST_MESSAGE = "Alguien acaba de reservar las últimas plazas. Elige otra fecha.";

/**
 * The checkout core shared by the public form and admin manual bookings:
 * price from the database, atomic seat hold, pending booking. Concurrent
 * callers on the last seats get exactly one success (hold_seats serialises on
 * the departure row); the others get a clear sold-out answer.
 */
export async function createPendingBooking(input: NewBooking): Promise<CreateBookingResult> {
  const db = createAdminClient();
  const { data: d, error } = await db
    .from("tour_departures")
    .select("id, starts_at, capacity, seats_taken, price_cents, status, tours!inner(status)")
    .eq("id", input.departureId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load departure: ${error.message}`);
  if (!d) return { ok: false, reason: "not_found", message: QUOTE_ERRORS.not_bookable };

  const quote = quoteDeparture(
    {
      priceCents: d.price_cents,
      capacity: d.capacity,
      seatsTaken: d.seats_taken,
      status: d.status,
      startsAt: d.starts_at,
      tourPublished: d.tours.status === "published",
    },
    input.travellers,
  );
  if (!quote.ok) {
    return {
      ok: false,
      reason: quote.reason,
      message: QUOTE_ERRORS[quote.reason],
      seatsLeft: quote.seatsLeft,
    };
  }

  const { data: holdId, error: holdError } = await db.rpc("hold_seats", {
    p_departure_id: d.id,
    p_qty: input.travellers,
    p_ttl: HOLD_TTL,
  });
  if (holdError) throw new Error(`hold_seats failed: ${holdError.message}`);
  if (!holdId) return { ok: false, reason: "race_lost", message: RACE_LOST_MESSAGE };

  const { data: booking, error: bookingError } = await db
    .from("bookings")
    .insert({
      departure_id: d.id,
      customer_name: input.name,
      email: input.email,
      phone: input.phone || null,
      travellers: input.travellers,
      total_cents: quote.totalCents, // server-computed, never from the client
      pickup_note: input.pickupNote || null,
      terms_accepted_at: new Date().toISOString(),
      cart_id: input.cartId ?? null,
    })
    .select("id, reference")
    .single();
  if (bookingError || !booking) {
    await db.rpc("release_hold", { p_hold_id: holdId });
    throw new Error(`booking insert failed: ${bookingError?.message}`);
  }
  await db.from("seat_holds").update({ booking_id: booking.id }).eq("id", holdId);

  return {
    ok: true,
    bookingId: booking.id,
    reference: booking.reference,
    holdId,
    totalCents: quote.totalCents,
  };
}

export type CartItem = { departureId: string; travellers: number };
export const MAX_CART_ITEMS = 6;

export type CreateCartResult =
  | { ok: true; anchorBookingId: string; bookingIds: string[]; totalCents: number }
  | { ok: false; message: string; itemIndex: number; seatsLeft?: number };

/**
 * Checkout of a whole cart: one pending booking per excursion, all sharing a
 * cart id so they are paid in one payment. All or nothing: if one excursion
 * cannot be held, the seats already taken for the others are given back. A
 * cart with a single line is an ordinary booking (no cart id).
 */
export async function createPendingCart(
  items: CartItem[],
  customer: Omit<NewBooking, "departureId" | "travellers" | "cartId">,
): Promise<CreateCartResult> {
  // The same departure twice becomes one line.
  const merged = new Map<string, number>();
  for (const i of items) merged.set(i.departureId, (merged.get(i.departureId) ?? 0) + i.travellers);
  const lines = [...merged].map(([departureId, travellers]) => ({ departureId, travellers }));
  const cartId = lines.length > 1 ? crypto.randomUUID() : undefined;

  const db = createAdminClient();
  const created: { id: string; totalCents: number }[] = [];
  for (const [index, line] of lines.entries()) {
    const r = await createPendingBooking({ ...customer, ...line, cartId });
    if (!r.ok) {
      for (const b of created) {
        await db.rpc("release_booking_seats", { p_booking_id: b.id });
        await db.from("bookings").update({ status: "cancelled" }).eq("id", b.id);
      }
      return { ok: false, message: r.message, itemIndex: index, seatsLeft: r.seatsLeft };
    }
    created.push({ id: r.bookingId, totalCents: r.totalCents });
  }
  return {
    ok: true,
    anchorBookingId: created[0].id,
    bookingIds: created.map((b) => b.id),
    totalCents: created.reduce((n, b) => n + b.totalCents, 0),
  };
}
