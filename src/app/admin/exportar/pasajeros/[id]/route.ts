import { csvResponse, ownerOnly, stamp, toCsv } from "@/lib/admin/csv";
import { createClient } from "@/lib/supabase/server";

/** Passenger list of one departure: paid bookings only, one row per traveller once named. */
export async function GET(_request: Request, ctx: RouteContext<"/admin/exportar/pasajeros/[id]">) {
  const denied = await ownerOnly();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });

  const db = await createClient();
  const { data, error } = await db
    .from("bookings")
    .select(
      "reference, customer_name, email, phone, travellers, pickup_note, notes, booking_travellers(name, document_id, position)",
    )
    .eq("departure_id", id)
    .eq("status", "paid")
    .order("customer_name");
  if (error) return new Response("Error", { status: 500 });

  return csvResponse(
    `pasajeros-${stamp()}.csv`,
    toCsv(
      [
        "Referencia",
        "Pasajero",
        "Documento",
        "Cliente",
        "Email",
        "Teléfono",
        "Personas",
        "Punto de recogida",
        "Notas",
      ],
      (data ?? []).flatMap((b) => {
        const named = [...b.booking_travellers].sort((x, y) => x.position - y.position);
        const people = named.length ? named : [{ name: "", document_id: null }];
        return people.map((p) => [
          b.reference,
          p.name,
          p.document_id,
          b.customer_name,
          b.email,
          b.phone,
          b.travellers,
          b.pickup_note,
          b.notes,
        ]);
      }),
    ),
  );
}
