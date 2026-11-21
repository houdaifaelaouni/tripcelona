import "server-only";
import { getBookingDetails, type BookingDetails } from "@/lib/booking/details";
import { createAdminClient } from "@/lib/supabase/admin";

export type Traveller = {
  id: string;
  position: number;
  name: string;
  documentId: string | null;
  phone: string | null;
  ticketCode: string | null;
  checkedInAt: string | null;
};

export type TicketTrip = {
  bookingId: string;
  reference: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  meetingPoint: string | null;
  mapUrl: string | null;
  travellers: number;
  rows: Traveller[];
};

export type TicketBundle = {
  /** The booking the customer's link points at (a cart's first booking). */
  anchor: BookingDetails;
  trips: TicketTrip[];
  /** Every trip has one row per traveller. */
  complete: boolean;
  /** Travellers can be edited until the first departure leaves. */
  editable: boolean;
};

/**
 * The tickets of one paid booking or of a whole cart, by the unguessable
 * booking id from the customer's link. Null for unknown ids.
 */
export async function getTicketBundle(bookingId: string): Promise<TicketBundle | null> {
  const anchor = await getBookingDetails({ id: bookingId });
  if (!anchor) return null;
  const db = createAdminClient();
  const ids = anchor.cart ? anchor.cart.lines.map((l) => l.id) : [anchor.id];
  const { data, error } = await db
    .from("bookings")
    .select(
      `id, reference, travellers, created_at,
       tour_departures!inner(starts_at, ends_at, tours!inner(title, meeting_point, map_url)),
       booking_travellers(id, position, name, document_id, phone, ticket_code, checked_in_at)`,
    )
    .in("id", ids)
    .order("created_at");
  if (error) throw new Error(`Failed to load tickets: ${error.message}`);
  const trips: TicketTrip[] = (data ?? []).map((b) => ({
    bookingId: b.id,
    reference: b.reference,
    title: b.tour_departures.tours.title,
    startsAt: b.tour_departures.starts_at,
    endsAt: b.tour_departures.ends_at,
    meetingPoint: b.tour_departures.tours.meeting_point,
    mapUrl: b.tour_departures.tours.map_url,
    travellers: b.travellers,
    rows: [...b.booking_travellers]
      .sort((x, y) => x.position - y.position)
      .map((r) => ({
        id: r.id,
        position: r.position,
        name: r.name,
        documentId: r.document_id,
        phone: r.phone,
        ticketCode: r.ticket_code,
        checkedInAt: r.checked_in_at,
      })),
  }));
  const complete = trips.every(
    (t) => t.rows.length >= t.travellers && t.rows.every((r) => r.ticketCode),
  );
  const firstStart = Math.min(...trips.map((t) => Date.parse(t.startsAt)));
  return { anchor, trips, complete, editable: Date.now() < firstStart };
}

/** A ticket by its QR code, for the staff check-in page. */
export async function getTicketByCode(code: string) {
  if (!/^[A-Z0-9]{10}$/.test(code)) return null;
  const { data, error } = await createAdminClient()
    .from("booking_travellers")
    .select(
      `id, name, document_id, phone, ticket_code, checked_in_at, position,
       bookings!inner(id, reference, status, travellers, customer_name, phone,
         tour_departures!inner(id, starts_at, tours!inner(title, meeting_point)))`,
    )
    .eq("ticket_code", code)
    .maybeSingle();
  if (error) throw new Error(`Failed to load ticket: ${error.message}`);
  return data;
}

/** Masks an ID document for display: only the last 3 characters. */
export function maskDocument(doc: string | null): string {
  if (!doc) return "—";
  return doc.length <= 3 ? doc : `${"•".repeat(Math.min(doc.length - 3, 6))}${doc.slice(-3)}`;
}
