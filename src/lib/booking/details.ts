import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type BookingDetails = {
  id: string;
  reference: string;
  status: "pending" | "paid" | "cancelled" | "refunded";
  customerName: string;
  email: string;
  phone: string | null;
  travellers: number;
  totalCents: number;
  pickupNote: string | null;
  /** Set when the booking is part of a cart paid in one payment (all lines, anchor included). */
  cart: { lines: CartBookingLine[]; totalCents: number } | null;
  departure: { id: string; startsAt: string; endsAt: string | null; status: string };
  tour: {
    slug: string;
    title: string;
    meetingPoint: string | null;
    mapUrl: string | null;
    packingList: string[];
    durationMinutes: number | null;
  };
};

export type CartBookingLine = {
  id: string;
  reference: string;
  title: string;
  startsAt: string;
  travellers: number;
  totalCents: number;
  meetingPoint: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/**
 * A booking with its departure and tour. Reads with the service role, so the
 * caller must only pass ids that came from the customer's own link (the
 * unguessable uuid) or from trusted server code.
 */
export async function getBookingDetails(
  by: { id: string } | { reference: string },
): Promise<BookingDetails | null> {
  if ("id" in by && !UUID.test(by.id)) return null;
  const query = createAdminClient()
    .from("bookings")
    .select(
      `id, reference, status, cart_id, customer_name, email, phone, travellers, total_cents, pickup_note,
       tour_departures!inner(id, starts_at, ends_at, status,
         tours!inner(slug, title, meeting_point, map_url, packing_list, duration_minutes))`,
    );
  const { data, error } = await (
    "id" in by ? query.eq("id", by.id) : query.eq("reference", by.reference)
  ).maybeSingle();
  if (error) throw new Error(`Failed to load booking: ${error.message}`);
  if (!data) return null;
  const d = data.tour_departures;
  const t = d.tours;
  let cart: BookingDetails["cart"] = null;
  if (data.cart_id) {
    const { data: rows, error: cartError } = await createAdminClient()
      .from("bookings")
      .select(
        "id, reference, travellers, total_cents, tour_departures!inner(starts_at, tours!inner(title, meeting_point))",
      )
      .eq("cart_id", data.cart_id)
      .order("created_at");
    if (cartError) throw new Error(`Failed to load cart bookings: ${cartError.message}`);
    const lines = (rows ?? []).map((r) => ({
      id: r.id,
      reference: r.reference,
      title: r.tour_departures.tours.title,
      startsAt: r.tour_departures.starts_at,
      travellers: r.travellers,
      totalCents: r.total_cents,
      meetingPoint: r.tour_departures.tours.meeting_point,
    }));
    cart = { lines, totalCents: lines.reduce((n, l) => n + l.totalCents, 0) };
  }
  return {
    cart,
    id: data.id,
    reference: data.reference,
    status: data.status,
    customerName: data.customer_name,
    email: data.email,
    phone: data.phone,
    travellers: data.travellers,
    totalCents: data.total_cents,
    pickupNote: data.pickup_note,
    departure: { id: d.id, startsAt: d.starts_at, endsAt: d.ends_at, status: d.status },
    tour: {
      slug: t.slug,
      title: t.title,
      meetingPoint: t.meeting_point,
      mapUrl: t.map_url,
      packingList: strings(t.packing_list),
      durationMinutes: t.duration_minutes,
    },
  };
}
