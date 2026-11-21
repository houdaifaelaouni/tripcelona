import { ownerOnly, stamp } from "@/lib/admin/csv";
import { passengerListPdf, type PassengerRow } from "@/lib/admin/passenger-list-pdf";
import { createClient } from "@/lib/supabase/server";
import { formatDateLong, formatTime } from "@/lib/tours/format";

/** Passenger list of one departure as a PDF table (paid bookings, one row per traveller). */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/admin/exportar/pasajeros/[id]/pdf">,
) {
  const denied = await ownerOnly();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });

  const db = await createClient();
  const [{ data: departure }, { data: bookings, error }] = await Promise.all([
    db
      .from("tour_departures")
      .select("starts_at, capacity, tours(title, slug)")
      .eq("id", id)
      .maybeSingle(),
    db
      .from("bookings")
      .select(
        "reference, customer_name, phone, travellers, pickup_note, booking_travellers(name, document_id, position, checked_in_at)",
      )
      .eq("departure_id", id)
      .eq("status", "paid")
      .order("customer_name"),
  ]);
  if (!departure) return new Response("Not found", { status: 404 });
  if (error) return new Response("Error", { status: 500 });

  const rows: PassengerRow[] = (bookings ?? []).flatMap((b) => {
    const named = [...b.booking_travellers].sort((x, y) => x.position - y.position);
    // Travellers not named yet still take a seat: one placeholder row each.
    const unnamed = Math.max(b.travellers - named.length, 0);
    const base = {
      phone: b.phone,
      reference: b.reference,
      customer: b.customer_name,
      pickup: b.pickup_note,
    };
    return [
      ...named.map((p) => ({
        ...base,
        name: p.name,
        document: p.document_id,
        boarded: !!p.checked_in_at,
      })),
      ...Array.from({ length: unnamed }, (_, i) => ({
        ...base,
        name: named.length === 0 && i === 0 ? b.customer_name : `Acompañante de ${b.customer_name}`,
        document: null,
        boarded: false,
      })),
    ];
  });

  const pdf = await passengerListPdf({
    tourTitle: departure.tours.title,
    when: `${formatDateLong(departure.starts_at)} · ${formatTime(departure.starts_at)}`,
    capacity: departure.capacity,
    rows,
    generatedAt: new Intl.DateTimeFormat("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/Madrid",
    }).format(new Date()),
  });
  const day = departure.starts_at.slice(0, 10);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pasajeros-${departure.tours.slug}-${day}-${stamp()}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
