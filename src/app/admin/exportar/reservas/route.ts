import { csvResponse, ownerOnly, stamp, toCsv } from "@/lib/admin/csv";
import { createClient } from "@/lib/supabase/server";

const STATUSES = ["pending", "paid", "cancelled", "refunded"] as const;

/** CSV of bookings, with the same status filter as the bookings list. */
export async function GET(request: Request) {
  const denied = await ownerOnly();
  if (denied) return denied;
  const estado = new URL(request.url).searchParams.get("estado") ?? "";

  const db = await createClient();
  let query = db
    .from("bookings")
    .select(
      "reference, status, created_at, customer_name, email, phone, travellers, total_cents, pickup_note, notes, tour_departures(starts_at, tours(title))",
    )
    .order("created_at", { ascending: false })
    .limit(5000);
  if ((STATUSES as readonly string[]).includes(estado))
    query = query.eq("status", estado as (typeof STATUSES)[number]);
  const { data, error } = await query;
  if (error) return new Response("Error", { status: 500 });

  const body = toCsv(
    [
      "Referencia",
      "Estado",
      "Creada",
      "Excursión",
      "Salida",
      "Cliente",
      "Email",
      "Teléfono",
      "Personas",
      "Total (EUR)",
      "Punto de recogida",
      "Notas",
    ],
    (data ?? []).map((b) => [
      b.reference,
      b.status,
      b.created_at,
      b.tour_departures.tours.title,
      b.tour_departures.starts_at,
      b.customer_name,
      b.email,
      b.phone,
      b.travellers,
      (b.total_cents / 100).toFixed(2),
      b.pickup_note,
      b.notes,
    ]),
  );
  return csvResponse(`reservas-${stamp()}.csv`, body);
}
