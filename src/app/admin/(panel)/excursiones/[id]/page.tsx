import { CalendarPlus, Clock, ExternalLink, Gauge, MapPin, Pencil } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/admin/flash";
import { RouteIllustration } from "@/components/admin/illustrations";
import {
  DepartureStatus,
  EmptyState,
  PageTitle,
  Panel,
  Table,
  TourStatus,
  td,
  th,
} from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { Checkbox, Input, Select, Textarea } from "@/components/admin/fields";
import { isoToMadrid } from "@/lib/admin/time";
import {
  cancelDepartureAction,
  createDeparture,
  updateDeparture,
  updateTour,
} from "@/lib/admin/tour-actions";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { dateParts, formatDateShort, formatDuration, formatPrice } from "@/lib/tours/format";
import { mediaUrl } from "@/lib/tours/media";

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
  const { data: images } = await db
    .from("tour_images")
    .select("alt, sort_order, media ( bucket, path, source_url )")
    .eq("tour_id", id)
    .order("sort_order")
    .limit(1);
  const coverUrl = images?.[0] ? mediaUrl(images[0].media) : null;

  const isOwner = staff.role === "owner";
  const now = new Date().toISOString();
  const upcoming = (departures ?? []).filter((d) => d.starts_at > now).reverse();
  const past = (departures ?? []).filter((d) => d.starts_at <= now).slice(0, 5);
  const next = upcoming.find((d) => d.status !== "cancelled");

  return (
    <div className="pb-24 lg:pb-0">
      <PageTitle
        back={{ href: "/admin/excursiones", label: "Excursiones" }}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <TourStatus status={tour.status} />
            <span>/excursiones/{tour.slug}</span>
          </span>
        }
      >
        {tour.title}
      </PageTitle>
      <Flash ok={ok} error={error} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        {/* Summary card: like a listing's reservation card, sticky on large screens. */}
        <aside className="lg:sticky lg:top-24 lg:order-2">
          <div className="overflow-hidden rounded-xl border border-secondary bg-primary shadow-lg">
            <div className="relative aspect-[16/10] bg-secondary">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={images?.[0]?.alt ?? `${tour.title}, foto principal`}
                  fill
                  sizes="(min-width: 1128px) 340px, 100vw"
                  className="object-cover"
                />
              ) : (
                <RouteIllustration className="absolute inset-0 m-auto h-3/4 w-auto" />
              )}
            </div>
            <div className="flex flex-col gap-5 p-5">
              <p className="text-sm text-tertiary">
                Desde{" "}
                <span className="text-lg font-semibold text-primary">
                  {tour.price_from_cents == null ? "—" : formatPrice(tour.price_from_cents)}
                </span>{" "}
                por persona
              </p>
              <ul className="flex flex-col gap-2.5 text-sm">
                <Fact icon={MapPin}>{tour.area || "Sin zona"}</Fact>
                <Fact icon={Clock}>
                  {tour.duration_minutes ? formatDuration(tour.duration_minutes) : "Sin duración"}
                </Fact>
                <Fact icon={Gauge}>{tour.difficulty || "Sin dificultad"}</Fact>
              </ul>
              <a
                href="#salidas"
                className="rounded-lg border border-secondary p-3 text-sm transition-colors hover:border-primary"
              >
                <span className="block text-xs font-semibold tracking-wide text-tertiary uppercase">
                  Próxima salida
                </span>
                {next ? (
                  <>
                    <span className="mt-0.5 block font-semibold first-letter:uppercase">
                      {formatDateShort(next.starts_at)} · {isoToMadrid(next.starts_at).time}
                    </span>
                    <span className="text-tertiary">
                      {Math.max(next.capacity - next.seats_taken, 0)} de {next.capacity} plazas
                      libres
                    </span>
                  </>
                ) : (
                  <span className="mt-0.5 block font-semibold text-error-primary">Sin fechas</span>
                )}
              </a>
              <Select label="Estado" name="status" form="tour-form" defaultValue={tour.status}>
                <option value="draft">Borrador (oculta)</option>
                <option value="published">Publicada</option>
                <option value="archived">Archivada (oculta)</option>
              </Select>
              <Button type="submit" form="tour-form" size="lg" className="hidden w-full lg:flex">
                Guardar excursión
              </Button>
              {tour.status === "published" && (
                <Link
                  className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline"
                  href={`/excursiones/${tour.slug}`}
                  target="_blank"
                >
                  Ver en la web <ExternalLink aria-hidden size={14} />
                </Link>
              )}
            </div>
          </div>
        </aside>

        <div className="min-w-0 lg:order-1">
          <form id="tour-form" action={updateTour.bind(null, tour.id)}>
            <Section
              title="Información básica"
              description="Lo que se ve en la tarjeta del catálogo y en la cabecera de la ficha."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Título"
                  name="title"
                  defaultValue={tour.title}
                  required
                  className="md:col-span-2"
                />
                <Input
                  label="Subtítulo"
                  name="subtitle"
                  defaultValue={tour.subtitle ?? ""}
                  className="md:col-span-2"
                />
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
              </div>
            </Section>

            <Section title="Punto de encuentro" description="Dónde y cómo llegar a la salida.">
              <div className="grid gap-4 md:grid-cols-2">
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
                {tour.published_at ? (
                  <Input
                    label="URL (no editable)"
                    name="_slug"
                    defaultValue={`/excursiones/${tour.slug}`}
                    disabled
                  />
                ) : (
                  <Input
                    label="URL de la excursión"
                    name="slug"
                    defaultValue={tour.slug.startsWith("borrador-") ? "" : tour.slug}
                    placeholder="p. ej. ruta-por-montserrat"
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    hint="Minúsculas y guiones. Se fija al publicar por primera vez."
                  />
                )}
              </div>
            </Section>

            <Section title="Descripción" description="Un párrafo corto y los puntos fuertes.">
              <div className="grid gap-4">
                <Textarea
                  label="Resumen"
                  name="summary"
                  rows={3}
                  defaultValue={tour.summary ?? ""}
                />
                <Textarea
                  label="Destacados (uno por línea)"
                  name="highlights"
                  rows={5}
                  defaultValue={asLines(tour.highlights)}
                />
              </div>
            </Section>

            <Section title="Qué incluye" description="Una línea por elemento.">
              <div className="grid gap-4 md:grid-cols-2">
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
                <Textarea
                  label="Qué llevar (uno por línea)"
                  name="packing_list"
                  rows={5}
                  defaultValue={asLines(tour.packing_list)}
                  className="md:col-span-2"
                />
              </div>
            </Section>

            <Section
              title="Buscadores"
              description="Título y descripción que muestran Google y las redes al compartir."
            >
              <div className="grid gap-4">
                <Input
                  label="Título SEO"
                  name="seo_title"
                  defaultValue={tour.seo_title ?? ""}
                  maxLength={70}
                  hint="Hasta 70 caracteres."
                />
                <Textarea
                  label="Descripción SEO"
                  name="seo_description"
                  rows={2}
                  maxLength={160}
                  defaultValue={tour.seo_description ?? ""}
                  hint="Hasta 160 caracteres."
                />
              </div>
            </Section>
          </form>

          <Panel
            title="Salidas"
            id="salidas"
            className="scroll-mt-24"
            description={
              isOwner
                ? "Fechas, plazas y precio de cada salida."
                : "Solo el propietario puede cambiar fechas, plazas y precios."
            }
          >
            {upcoming.length === 0 ? (
              <EmptyState illustration="calendar" title="Sin salidas futuras">
                <span className="text-error-primary">
                  No hay salidas futuras: la excursión no se puede reservar.
                </span>
              </EmptyState>
            ) : (
              <ul className="-mx-5 -mt-5 divide-y divide-secondary">
                {upcoming.map((d) => {
                  const start = isoToMadrid(d.starts_at);
                  const end = d.ends_at ? isoToMadrid(d.ends_at).time : "";
                  const cancelled = d.status === "cancelled";
                  const { day, month } = dateParts(d.starts_at);
                  const pct = d.capacity ? Math.min(100, (d.seats_taken / d.capacity) * 100) : 0;
                  return (
                    <li key={d.id} className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <span
                          aria-hidden
                          className={
                            cancelled
                              ? "flex size-14 shrink-0 flex-col items-center justify-center rounded-full border border-secondary text-tertiary"
                              : "flex size-14 shrink-0 flex-col items-center justify-center rounded-full border border-fg-primary"
                          }
                        >
                          <span className="text-base leading-none font-semibold">{day}</span>
                          <span className="text-xs leading-tight uppercase">{month}</span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-sm first-letter:uppercase">
                              {formatDateShort(d.starts_at)}
                            </strong>
                            <DepartureStatus status={d.status} />
                          </div>
                          <p className="mt-0.5 text-sm text-tertiary">
                            {start.time}
                            {end && `–${end}`} · {euros(d.price_cents)} € · {d.seats_taken} de{" "}
                            {d.capacity} plazas ocupadas o retenidas
                          </p>
                          <div
                            aria-hidden
                            className="mt-2 h-1.5 max-w-60 overflow-hidden rounded-full bg-secondary"
                          >
                            <div
                              className="h-full rounded-full bg-brand-solid"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      {isOwner && !cancelled && (
                        <details className="group mt-3 sm:ml-18">
                          <summary className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg text-sm font-semibold text-brand-secondary hover:underline">
                            <Pencil aria-hidden size={14} />
                            Editar salida
                          </summary>
                          <form
                            action={updateDeparture.bind(null, tour.id, d.id)}
                            className="mt-3 grid grid-cols-2 items-end gap-3 md:grid-cols-3"
                          >
                            <Input
                              label="Fecha"
                              name="date"
                              type="date"
                              defaultValue={start.date}
                              required
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
                            <Button type="submit" className="col-span-2 md:col-span-1">
                              Guardar
                            </Button>
                          </form>
                          <details className="mt-4 text-sm">
                            <summary className="cursor-pointer text-error-primary">
                              Cancelar esta salida…
                            </summary>
                            <form
                              action={cancelDepartureAction.bind(null, tour.id, d.id)}
                              className="mt-2 flex flex-col gap-3 rounded-lg bg-error-primary p-4"
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
                                className="self-start text-error-primary"
                              >
                                Cancelar salida y reembolsar
                              </Button>
                            </form>
                          </details>
                        </details>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {isOwner && (
              <form
                action={createDeparture.bind(null, tour.id)}
                className="mt-5 grid grid-cols-2 items-end gap-3 rounded-xl border border-dashed border-primary p-4 md:grid-cols-3"
              >
                <p className="col-span-2 flex items-center gap-2 text-base font-semibold md:col-span-3">
                  <CalendarPlus aria-hidden size={18} className="text-brand-secondary" />
                  Nueva salida
                </p>
                <Input label="Fecha" name="date" type="date" required />
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
                <Button type="submit" variant="secondary">
                  Añadir salida
                </Button>
              </form>
            )}

            {past.length > 0 && (
              <details className="mt-5 text-sm">
                <summary className="cursor-pointer font-semibold text-tertiary">
                  Salidas pasadas
                </summary>
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
        </div>
      </div>

      {/* Phones and tablets: the save button stays in reach, as a bottom bar. */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-secondary bg-primary px-4 py-3 lg:hidden">
        <p className="min-w-0 truncate text-sm">
          <span className="font-semibold">
            {tour.price_from_cents == null ? "—" : formatPrice(tour.price_from_cents)}
          </span>{" "}
          <span className="text-tertiary">desde</span>
        </p>
        <Button type="submit" form="tour-form">
          Guardar excursión
        </Button>
      </div>
    </div>
  );
}

/** A form section: heading and one line of help above the fields, on a white card. */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-6 rounded-xl border border-secondary bg-primary p-5 md:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 mb-5 text-sm text-tertiary">{description}</p>}
      {children}
    </section>
  );
}

function Fact({ icon: Icon, children }: { icon: typeof MapPin; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <Icon aria-hidden size={18} className="shrink-0 text-brand-secondary" />
      <span className="first-letter:uppercase">{children}</span>
    </li>
  );
}
