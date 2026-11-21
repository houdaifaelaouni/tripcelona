import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BookingDetails } from "./details";

export type Passenger = { name: string; documentId: string | null };

/** One ticket per booking line: a single booking, or every line of a paid cart. */
export type TicketLine = {
  bookingId: string;
  reference: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  travellers: number;
  meetingPoint: string | null;
  passengers: Passenger[];
};

export type TicketBundle = {
  booking: BookingDetails;
  lines: TicketLine[];
  completedAt: string | null;
};

/**
 * The lines a paid booking's tickets cover, with the passengers saved so far.
 * The caller has already checked the booking id came from the customer's link.
 */
export async function getTicketBundle(booking: BookingDetails): Promise<TicketBundle> {
  const base = booking.cart
    ? booking.cart.lines.map((l) => ({
        bookingId: l.id,
        reference: l.reference,
        title: l.title,
        startsAt: l.startsAt,
        endsAt: null as string | null,
        travellers: l.travellers,
        meetingPoint: l.meetingPoint,
      }))
    : [
        {
          bookingId: booking.id,
          reference: booking.reference,
          title: booking.tour.title,
          startsAt: booking.departure.startsAt,
          endsAt: booking.departure.endsAt,
          travellers: booking.travellers,
          meetingPoint: booking.tour.meetingPoint,
        },
      ];
  const ids = base.map((l) => l.bookingId);
  const db = createAdminClient();
  const [{ data: rows, error }, { data: anchor, error: anchorError }] = await Promise.all([
    db
      .from("booking_travellers")
      .select("booking_id, name, document_id, position")
      .in("booking_id", ids)
      .order("position"),
    db.from("bookings").select("passengers_completed_at").eq("id", booking.id).maybeSingle(),
  ]);
  if (error) throw new Error(`Failed to load passengers: ${error.message}`);
  if (anchorError) throw new Error(`Failed to load booking: ${anchorError.message}`);
  const lines = base.map((l) => ({
    ...l,
    passengers: (rows ?? [])
      .filter((r) => r.booking_id === l.bookingId)
      .map((r) => ({ name: r.name, documentId: r.document_id })),
  }));
  return { booking, lines, completedAt: anchor?.passengers_completed_at ?? null };
}
