import { csvResponse, ownerOnly, stamp, toCsv } from "@/lib/admin/csv";
import { createClient } from "@/lib/supabase/server";

/** CSV of quote requests (?tipo=presupuestos) or contact messages (?tipo=mensajes). */
export async function GET(request: Request) {
  const denied = await ownerOnly();
  if (denied) return denied;
  const tipo = new URL(request.url).searchParams.get("tipo");
  const db = await createClient();

  if (tipo === "mensajes") {
    const { data, error } = await db
      .from("leads")
      .select("created_at, status, payload")
      .eq("source", "contact")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) return new Response("Error", { status: 500 });
    return csvResponse(
      `mensajes-${stamp()}.csv`,
      toCsv(
        ["Recibido", "Estado", "Nombre", "Email", "Teléfono", "Mensaje"],
        (data ?? []).map((l) => {
          const p = (l.payload ?? {}) as Record<string, unknown>;
          return [l.created_at, l.status, p.name, p.email, p.phone, p.message];
        }),
      ),
    );
  }

  const { data, error } = await db
    .from("tour_requests")
    .select(
      "created_at, status, name, email, phone, group_size, preferred_dates, budget, message, admin_notes, tours(title)",
    )
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) return new Response("Error", { status: 500 });
  return csvResponse(
    `presupuestos-${stamp()}.csv`,
    toCsv(
      [
        "Recibida",
        "Estado",
        "Nombre",
        "Email",
        "Teléfono",
        "Personas",
        "Fechas",
        "Excursión",
        "Presupuesto",
        "Mensaje",
        "Notas internas",
      ],
      (data ?? []).map((r) => [
        r.created_at,
        r.status,
        r.name,
        r.email,
        r.phone,
        r.group_size,
        r.preferred_dates,
        r.tours?.title,
        r.budget,
        r.message,
        r.admin_notes,
      ]),
    ),
  );
}
