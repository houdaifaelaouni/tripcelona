"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCheckoutDeparture } from "./queries";
import { QUOTE_ERRORS, quoteDeparture } from "./quote";
import { checkoutSchema, fieldErrors, type CheckoutField, type CheckoutState } from "./schema";

const HOLD_TTL = "15 minutes";

function echo(form: FormData): Partial<Record<CheckoutField, string>> {
  const keys: CheckoutField[] = [
    "departureId",
    "travellers",
    "name",
    "email",
    "phone",
    "pickupNote",
  ];
  return Object.fromEntries(keys.map((k) => [k, String(form.get(k) ?? "")]));
}

/**
 * Validates checkout, recomputes the price from the database, holds the seats
 * atomically and creates a pending booking. Payment (Sprint 6, Redsys per D1)
 * picks up from the pending booking.
 */
export async function startCheckout(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    // A filled honeypot gets the same generic answer as any invalid form.
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fieldErrors: fieldErrors(parsed.error),
      values: echo(form),
    };
  }
  const input = parsed.data;

  const departure = await getCheckoutDeparture(input.departureId);
  if (!departure) {
    return {
      status: "error",
      message: QUOTE_ERRORS.not_bookable,
      fieldErrors: {},
      values: echo(form),
    };
  }
  const quote = quoteDeparture(departure, input.travellers);
  if (!quote.ok) {
    return {
      status: "error",
      message: QUOTE_ERRORS[quote.reason],
      fieldErrors:
        quote.reason === "not_enough_seats"
          ? { travellers: `Quedan ${quote.seatsLeft} plazas.` }
          : {},
      values: echo(form),
    };
  }

  const db = createAdminClient();
  const { data: holdId, error: holdError } = await db.rpc("hold_seats", {
    p_departure_id: departure.id,
    p_qty: input.travellers,
    p_ttl: HOLD_TTL,
  });
  if (holdError) throw new Error(`hold_seats failed: ${holdError.message}`);
  if (!holdId) {
    // Lost the race for the last seats between page load and submit.
    return {
      status: "error",
      message: "Alguien acaba de reservar las últimas plazas. Elige otra fecha.",
      fieldErrors: {},
      values: echo(form),
    };
  }

  const { data: booking, error: bookingError } = await db
    .from("bookings")
    .insert({
      departure_id: departure.id,
      customer_name: input.name,
      email: input.email,
      phone: input.phone,
      travellers: input.travellers,
      total_cents: quote.totalCents, // server-computed, never from the client
      pickup_note: input.pickupNote || null,
      terms_accepted_at: new Date().toISOString(),
    })
    .select("id, reference")
    .single();
  if (bookingError || !booking) {
    await db.rpc("release_hold", { p_hold_id: holdId });
    throw new Error(`booking insert failed: ${bookingError?.message}`);
  }

  await db.from("seat_holds").update({ booking_id: booking.id }).eq("id", holdId);

  // Unguessable id in the URL (references are sequential).
  redirect(`/reservar/pendiente?id=${booking.id}`);
}
