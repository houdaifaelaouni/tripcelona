/**
 * Server-side pricing. The only inputs are the departure as stored in the
 * database and the traveller count; nothing price-related is read from the
 * client.
 */
export type QuotableDeparture = {
  priceCents: number;
  capacity: number;
  seatsTaken: number;
  status: "open" | "sold_out" | "cancelled";
  startsAt: string;
  tourPublished: boolean;
};

export type Quote =
  | { ok: true; unitCents: number; travellers: number; totalCents: number; seatsLeft: number }
  | {
      ok: false;
      reason: "not_bookable" | "past" | "sold_out" | "not_enough_seats";
      seatsLeft: number;
    };

export function quoteDeparture(d: QuotableDeparture, travellers: number, now = Date.now()): Quote {
  const seatsLeft = Math.max(d.capacity - d.seatsTaken, 0);
  if (!d.tourPublished || d.status === "cancelled")
    return { ok: false, reason: "not_bookable", seatsLeft };
  if (Date.parse(d.startsAt) <= now) return { ok: false, reason: "past", seatsLeft };
  if (d.status === "sold_out" || seatsLeft === 0)
    return { ok: false, reason: "sold_out", seatsLeft };
  if (travellers > seatsLeft) return { ok: false, reason: "not_enough_seats", seatsLeft };
  return {
    ok: true,
    unitCents: d.priceCents,
    travellers,
    totalCents: d.priceCents * travellers,
    seatsLeft,
  };
}

export const QUOTE_ERRORS: Record<Exclude<Quote, { ok: true }>["reason"], string> = {
  not_bookable: "Esta salida ya no está disponible.",
  past: "Esta salida ya ha pasado.",
  sold_out: "Esta salida está completa.",
  not_enough_seats: "No quedan plazas suficientes para tu grupo en esta salida.",
};
