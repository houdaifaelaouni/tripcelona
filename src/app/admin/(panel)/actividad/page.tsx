import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageTitle, Panel, ResultCount, Table, td, th } from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { Select } from "@/components/admin/fields";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Actividad" };

const when = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  });

const ENTITY_LABELS: Record<string, string> = {
  settings: "Ajustes y contenido",
  bookings: "Reservas",
  tours: "Excursiones",
  tour_departures: "Salidas",
  posts: "Blog",
  pages: "Páginas",
  faqs: "Preguntas frecuentes",
  reviews: "Opiniones",
  media: "Medios",
  redirects: "Redirecciones",
  tour_requests: "Solicitudes",
  profiles: "Equipo",
};

/** Who changed what and when: the append-only audit trail (FR-82). */
export default async function Activity({ searchParams }: PageProps<"/admin/actividad">) {
  await requireStaff("owner");
  const sp = await searchParams;
  const entity = typeof sp.seccion === "string" ? sp.seccion : "";
  const db = await createClient();

  let query = db
    .from("audit_log")
    .select("id, actor, action, entity, entity_id, diff, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (entity) query = query.eq("entity", entity);
  const [{ data: rows }, { data: members }] = await Promise.all([query, db.rpc("staff_members")]);
  const who = new Map((members ?? []).map((m) => [m.id, m.email]));

  return (
    <>
      <PageTitle description="Las 200 últimas acciones del equipo en el panel.">
        Actividad
      </PageTitle>
      <Panel
        title="Registro de cambios"
        footer={<ResultCount count={rows?.length ?? 0} one="acción" many="acciones" />}
      >
        <form
          className="-mx-5 -mt-5 flex flex-wrap items-end gap-3 border-b border-secondary px-5 py-4"
          role="search"
        >
          <Select label="Sección" name="seccion" defaultValue={entity} className="min-w-56">
            <option value="">Todas</option>
            {Object.entries(ENTITY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>
        {rows?.length ? (
          <Table>
            <thead>
              <tr>
                <th className={th}>Cuándo</th>
                <th className={th}>Quién</th>
                <th className={th}>Acción</th>
                <th className={th}>Sección</th>
                <th className={th}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className={`${td} whitespace-nowrap`}>{when(r.created_at)}</td>
                  <td className={td}>{(r.actor && who.get(r.actor)) || "Sistema"}</td>
                  <td className={`${td} font-mono text-xs`}>{r.action}</td>
                  <td className={td}>
                    {ENTITY_LABELS[r.entity] ?? r.entity}
                    {r.entity === "bookings" && r.entity_id && (
                      <>
                        {" "}
                        <Link
                          href={`/admin/reservas/${r.entity_id}`}
                          className="text-brand-secondary hover:underline"
                        >
                          ver
                        </Link>
                      </>
                    )}
                  </td>
                  <td className={`${td} max-w-xs truncate font-mono text-xs`}>
                    {r.diff ? JSON.stringify(r.diff) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState illustration="tickets" title="Aún no hay actividad">
            Los cambios que haga el equipo aparecerán aquí.
          </EmptyState>
        )}
      </Panel>
    </>
  );
}
