import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/admin/flash";
import { DepartureStatus, PageTitle, Panel, Table, td, th } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/field";
import { isoToMadrid } from "@/lib/admin/time";
import {
  cancelDepartureAction,
  createDeparture,
  updateDeparture,
  updateTour,
} from "@/lib/admin/tour-actions";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { formatDateShort } from "@/lib/tours/format";

export const metadata: Metadata = { title: "Editar excursión" };

function asLines(value: unknown): string {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string").join("\n") : "";
}
const euros = (cents: number | null) =>
  cents == null ? "" : String(cents / 100).replace(".", ",");

export default async function TourEdit({
  params,
  searchParams,
}: PageProps<"/admin/excursiones/[id]">) {
  const staff = await requireStaff();
  const { id } = await params;
  const { ok, error } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const db = await createClient();
  const { data: tour } = await db.from("tours").select("*").eq("id", id).maybeSingle();
  if (!tour) notFound();
  const { data: departures } = await db
    .from("tour_departures")
    .select("id, starts_at, ends_at, capacity, seats_taken, price_cents, status")
    .eq("tour_id", id)
    .order("starts_at", { ascending: false })
    .limit(30);

  const isOwner = staff.role === "owner";
  const now = new Date().toISOString();
  const upcoming = (departures ?? []).filter((d) => d.starts_at > now).reverse();
  const past = (departures ?? []).filter((d) => d.starts_at <= now).slice(0, 5);

  return (
    <>
      <PageTitle
        back={{ href: "/admin/excursiones", label: "Excursiones" }}
        actions={
          tour.status === "published" && (
            <Link
              className="text-meta text-blue hover:underline"
              href={`/excursiones/${tour.slug}`}
              target="_blank"
            >
              Ver en la web ↗
            </Link>
          )
        }
      >
        {tour.title}
      </PageTitle>
      <Flash ok={ok} error={error} />

      <form action={updateTour.bind(null, tour.id)}>
        <Panel title="Contenido">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Título" name="title" defaultValue={tour.title} required />
            <Input label="Subtítulo" name="subtitle" defaultValue={tour.subtitle ?? ""} />
            <Input label="Zona" name="area" defaultValue={tour.area ?? ""} />
            <Input label="Dificultad" name="difficulty" defaultValue={tour.difficulty ?? ""} />
            <Input
              label="Duración (minutos)"
              name="duration_minutes"
              inputMode="numeric"
              defaultValue={tour.duration_minutes ?? ""}
            />
            <Input
              label="Precio «desde» (€)"
              name="price_from"
              inputMode="decimal"
              defaultValue={euros(tour.price_from_cents)}
              required
            />
            <Input
              label="Punto de encuentro"
              name="meeting_point"
              defaultValue={tour.meeting_point ?? ""}
              className="md:col-span-2"
            />
            <Input
              label="Enlace al mapa (https)"
              name="map_url"
              defaultValue={tour.map_url ?? ""}
            />
            <Input
              label="URL (no editable)"
              name="_slug"
              defaultValue={`/excursiones/${tour.slug}`}
              disabled
            />
          </div>
          <div className="mt-4 grid gap-4">
            <Textarea label="Resumen" name="summary" rows={3} defaultValue={tour.summary ?? ""} />
            <div className="grid gap-4 md:grid-cols-2">
              <Textarea
                label="Destacados (uno por línea)"
                name="highlights"
                rows={5}
                defaultValue={asLines(tour.highlights)}
              />
              <Textarea
                label="Qué llevar (uno por línea)"
                name="packing_list"
                rows={5}
                defaultValue={asLines(tour.packing_list)}
              />
              <Textarea
                label="Incluye (uno por línea)"
                name="inclusions"
                rows={5}
                defaultValue={asLines(tour.inclusions)}
              />
              <Textarea
                label="No incluye (uno por línea)"
                name="exclusions"
                rows={5}
                defaultValue={asLines(tour.exclusions)}
              />
            </div>
          </div>
        </Panel>
        <Panel title="SEO y publicación">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Título SEO"
              name="seo_title"
              defaultValue={tour.seo_title ?? ""}
              maxLength={70}
            />
            <Select label="Estado" name="status" defaultValue={tour.status}>
              <option value="draft">Borrador (oculta)</option>
              <option value="published">Publicada</option>
              <option value="archived">Archivada (oculta)</option>
            </Select>
            <Textarea
              label="Descripción SEO"
              name="seo_description"
              rows={2}
              maxLength={160}
              defaultValue={tour.seo_description ?? ""}
              className="md:col-span-2"
            />
          </div>
          <Button type="submit" className="mt-4">
            Guardar excursión
          </Button>
        </Panel>
      </form>

      <Panel title="Salidas" id="salidas" className="scroll-mt-4">
        {!isOwner && (
          <p className="mb-3 text-meta text-muted">
            Solo el propietario puede cambiar fechas, plazas y precios.
          </p>
        )}
        {upcoming.length === 0 && (
          <p className="mb-3 text-danger">
            No hay salidas futuras: la excursión no se puede reservar.
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {upcoming.map((d) => {
            const start = isoToMadrid(d.starts_at);
            const end = d.ends_at ? isoToMadrid(d.ends_at).time : "";
            const cancelled = d.status === "cancelled";
            return (
              <li key={d.id} className="rounded-control border border-border p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-meta">
                  <strong className="first-letter:uppercase">{formatDateShort(d.starts_at)}</strong>
                  <DepartureStatus status={d.status} />
                  <span className="text-muted">
                    {d.seats_taken} de {d.capacity} plazas ocupadas o retenidas
                  </span>
                </div>
                {isOwner && !cancelled ? (
                  <>
                    <form
                      action={updateDeparture.bind(null, tour.id, d.id)}
                      className="grid grid-cols-2 items-end gap-2 md:grid-cols-7"
                    >
                      <Input
                        label="Fecha"
                        name="date"
                        type="date"
                        defaultValue={start.date}
                        required
                        className="col-span-2 md:col-span-1"
                      />
                      <Input
                        label="Salida"
                        name="start"
                        type="time"
                        defaultValue={start.time}
                        required
                      />
                      <Input label="Regreso" name="end" type="time" defaultValue={end} />
                      <Input
                        label="Plazas"
                        name="capacity"
                        type="number"
                        min={d.seats_taken || 1}
                        defaultValue={d.capacity}
                        required
                      />
                      <Input
                        label="Precio €"
                        name="price"
                        inputMode="decimal"
                        defaultValue={euros(d.price_cents)}
                        required
                      />
                      <Select
                        label="Venta"
                        name="status"
                        defaultValue={d.status === "sold_out" ? "sold_out" : "open"}
                      >
                        <option value="open">Abierta</option>
                        <option value="sold_out">Cerrada</option>
                      </Select>
                      <Button type="submit" size="sm" className="h-10">
                        Guardar
                      </Button>
                    </form>
                    <details className="mt-2 text-meta">
                      <summary className="cursor-pointer text-danger">
                        Cancelar esta salida…
                      </summary>
                      <form
                        action={cancelDepartureAction.bind(null, tour.id, d.id)}
                        className="mt-2 flex flex-col gap-2"
                      >
                        <Checkbox
                          name="confirm"
                          required
                          label="Confirmo que se cancela la salida: se reembolsarán todas las reservas pagadas y se avisará a los clientes por email. No se puede deshacer."
                        />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="self-start text-danger"
                        >
                          Cancelar salida y reembolsar
                        </Button>
                      </form>
                    </details>
                  </>
                ) : (
                  <p className="text-meta">
                    {start.time}
                    {end && `–${end}`} · {euros(d.price_cents)} €
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        {isOwner && (
          <form
            action={createDeparture.bind(null, tour.id)}
            className="mt-4 grid grid-cols-2 items-end gap-2 rounded-control border border-dashed border-border-strong p-3 md:grid-cols-6"
          >
            <p className="col-span-2 text-meta font-semibold md:col-span-6">Nueva salida</p>
            <Input
              label="Fecha"
              name="date"
              type="date"
              required
              className="col-span-2 md:col-span-1"
            />
            <Input label="Salida" name="start" type="time" defaultValue="08:00" required />
            <Input label="Regreso" name="end" type="time" />
            <Input label="Plazas" name="capacity" type="number" min={1} required />
            <Input
              label="Precio €"
              name="price"
              inputMode="decimal"
              defaultValue={euros(tour.price_from_cents)}
              required
            />
            <Button type="submit" size="sm" className="h-10">
              Añadir salida
            </Button>
          </form>
        )}

        {past.length > 0 && (
          <details className="mt-4 text-meta">
            <summary className="cursor-pointer text-muted">Salidas pasadas</summary>
            <Table className="mt-2">
              <thead>
                <tr>
                  <th className={th}>Fecha</th>
                  <th className={th}>Plazas</th>
                  <th className={th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {past.map((d) => (
                  <tr key={d.id}>
                    <td className={td}>{formatDateShort(d.starts_at)}</td>
                    <td className={td}>
                      {d.seats_taken} / {d.capacity}
                    </td>
                    <td className={td}>
                      <DepartureStatus status={d.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </details>
        )}
      </Panel>
    </>
  );
}
