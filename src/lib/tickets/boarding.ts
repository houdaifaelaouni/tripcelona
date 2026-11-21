import "server-only";
import { ensureTravellerRows } from "@/lib/booking/passengers";
import { createAdminClient } from "@/lib/supabase/admin";

export type BoardingBooking = {
  id: string;
  reference: string;
  customerName: string;
  travellers: number;
  boarded: number;
};

export type DepartureBoard = {
  id: string;
  title: string;
  startsAt: string;
  bookings: BoardingBooking[];
  /** Seats sold (paid), passengers on board, still to board. */
  totals: { tickets: number; bookings: number; boarded: number; pending: number };
};

/** Paid bookings of a departure with how many of each are on board. */
export async function getDepartureBoard(departureId: string): Promise<DepartureBoard | null> {
  const db = createAdminClient();
  const { data: dep } = await db
    .from("tour_departures")
    .select("id, starts_at, tours!inner(title)")
    .eq("id", departureId)
    .maybeSingle();
  if (!dep) return null;
  const { data, error } = await db
    .from("bookings")
    .select("id, reference, customer_name, travellers, booking_travellers(checked_in_at)")
    .eq("departure_id", departureId)
    .eq("status", "paid")
    .order("customer_name");
  if (error) throw new Error(`Failed to load bookings: ${error.message}`);
  const bookings = (data ?? []).map((b) => ({
    id: b.id,
    reference: b.reference,
    customerName: b.customer_name,
    travellers: b.travellers,
    boarded: Math.min(b.travellers, b.booking_travellers.filter((t) => t.checked_in_at).length),
  }));
  const tickets = bookings.reduce((n, b) => n + b.travellers, 0);
  const boarded = bookings.reduce((n, b) => n + b.boarded, 0);
  return {
    id: dep.id,
    title: dep.tours.title,
    startsAt: dep.starts_at,
    bookings,
    totals: { tickets, bookings: bookings.length, boarded, pending: tickets - boarded },
  };
}

export type BoardResult =
  | {
      status: "boarded" | "already" | "undone";
      reference: string;
      name: string;
      travellers: number;
    }
  | {
      status: "not_found" | "not_paid" | "other_departure";
      reference: string | null;
      detail?: string;
    };

/**
 * Boards every passenger of a booking (the driver scans one QR per booking),
 * or undoes it. Checks the ticket belongs to this departure and is paid.
 */
export async function boardBooking(
  departureId: string,
  reference: string,
  options: { undo?: boolean; by?: string | null } = {},
): Promise<BoardResult> {
  const db = createAdminClient();
  const { data: b } = await db
    .from("bookings")
    .select(
      "id, reference, status, customer_name, travellers, departure_id, tour_departures!inner(starts_at, tours!inner(title)), booking_travellers(checked_in_at)",
    )
    .eq("reference", reference)
    .maybeSingle();
  if (!b) return { status: "not_found", reference };
  if (b.status !== "paid") return { status: "not_paid", reference };
  if (b.departure_id !== departureId)
    return {
      status: "other_departure",
      reference,
      detail: `${b.tour_departures.tours.title} · ${b.tour_departures.starts_at}`,
    };
  const base = { reference: b.reference, name: b.customer_name, travellers: b.travellers };
  if (
    !options.undo &&
    b.booking_travellers.length >= b.travellers &&
    b.booking_travellers.every((t) => t.checked_in_at)
  ) {
    return { status: "already", ...base };
  }
  await ensureTravellerRows({ id: b.id, travellers: b.travellers, customerName: b.customer_name });
  let q = db
    .from("booking_travellers")
    .update(
      options.undo
        ? { checked_in_at: null, checked_in_by: null }
        : { checked_in_at: new Date().toISOString(), checked_in_by: options.by ?? null },
    )
    .eq("booking_id", b.id);
  q = options.undo ? q.not("checked_in_at", "is", null) : q.is("checked_in_at", null);
  const { error } = await q;
  if (error) throw new Error(`Failed to update boarding: ${error.message}`);
  return { status: options.undo ? "undone" : "boarded", ...base };
}
