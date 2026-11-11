"use server";

import { randomBytes } from "node:crypto";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { cancelDeparture } from "@/lib/payments/service";
import { createClient } from "@/lib/supabase/server";
import { TOURS_TAG } from "@/lib/tours/queries";
import { storeImage } from "./media-store";
import { backWith } from "./redirect";
import { eurosToCents, madridToIso } from "./time";

const lines = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean),
  );
const optionalText = z
  .string()
  .optional()
  .transform((v) => (v?.trim() ? v.trim() : null));

const tourSchema = z.object({
  title: z.string().trim().min(3, "El título es obligatorio."),
  subtitle: optionalText,
  area: optionalText,
  summary: optionalText,
  difficulty: optionalText,
  duration_minutes: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? Number(v) : null))
    .refine(
      (v) => v === null || (Number.isInteger(v) && v > 0),
      "Duración en minutos, número entero.",
    ),
  price_from: z.string().transform((v, ctx) => {
    const cents = eurosToCents(v);
    if (cents === null) ctx.addIssue({ code: "custom", message: "Precio «desde» no válido." });
    return cents ?? 0;
  }),
  meeting_point: optionalText,
  map_url: optionalText.refine(
    (v) => v === null || /^https:\/\//.test(v),
    "El mapa debe ser un enlace https.",
  ),
  highlights: lines,
  inclusions: lines,
  exclusions: lines,
  packing_list: lines,
  seo_title: optionalText,
  seo_description: optionalText,
  status: z.enum(["draft", "published", "archived"]),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "La URL solo admite minúsculas, números y guiones.")
    .optional(),
});

function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Revisa el formulario.";
}

/** Staff create a draft tour and land in its editor. */
export async function createTour() {
  const staff = await assertStaff("any");
  const db = await createClient();
  const { data, error } = await db
    .from("tours")
    .insert({
      title: "Nueva excursión",
      slug: `borrador-${randomBytes(3).toString("hex")}`,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) backWith("/admin/excursiones", { error: `No se pudo crear: ${error.message}` });
  await audit(staff.id, "tour.create", "tours", data.id);
  redirect(`/admin/excursiones/${data.id}`);
}

/** Staff (owner or editor) edit tour content (US-25). */
export async function updateTour(tourId: string, form: FormData) {
  const staff = await assertStaff("any");
  const back = `/admin/excursiones/${tourId}`;
  const parsed = tourSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) backWith(back, { error: firstError(parsed.error) });
  const { price_from, slug, ...fields } = parsed.data;

  const db = await createClient();
  const { data: current } = await db
    .from("tours")
    .select("status, published_at, slug")
    .eq("id", tourId)
    .single();
  // The URL can change only until the tour is first published (links stay stable).
  const nextSlug = !current?.published_at && slug ? slug : current?.slug;
  if (fields.status === "published" && nextSlug?.startsWith("borrador-"))
    backWith(back, { error: "Elige la URL de la excursión antes de publicarla." });
  const { error } = await db
    .from("tours")
    .update({
      ...fields,
      slug: nextSlug,
      price_from_cents: price_from,
      published_at:
        fields.status === "published" && !current?.published_at
          ? new Date().toISOString()
          : current?.published_at,
    })
    .eq("id", tourId);
  if (error)
    backWith(back, {
      error:
        error.code === "23505"
          ? "Ya hay otra excursión con esa URL."
          : `No se pudo guardar: ${error.message}`,
    });

  await audit(staff.id, "tour.update", "tours", tourId, {
    status: fields.status,
    title: fields.title,
    price_from_cents: price_from,
  });
  updateTag(TOURS_TAG);
  backWith(back, { ok: "guardado" });
}

const departureSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida."),
    start: z.string().regex(/^\d{2}:\d{2}$/, "Hora de salida no válida."),
    end: z.string().regex(/^(\d{2}:\d{2})?$/, "Hora de regreso no válida."),
    capacity: z.coerce.number().int("Plazas: número entero.").min(1, "Mínimo 1 plaza.").max(500),
    price: z.string(),
    status: z.enum(["open", "sold_out"]).optional(),
  })
  .transform((v, ctx) => {
    const priceCents = eurosToCents(v.price);
    if (priceCents === null || priceCents === 0) {
      ctx.addIssue({ code: "custom", message: "Precio no válido." });
      return z.NEVER;
    }
    const startsAt = madridToIso(v.date, v.start);
    const endsAt = v.end ? madridToIso(v.date, v.end) : null;
    if (endsAt && endsAt <= startsAt) {
      ctx.addIssue({ code: "custom", message: "El regreso debe ser posterior a la salida." });
      return z.NEVER;
    }
    return { startsAt, endsAt, capacity: v.capacity, priceCents, status: v.status };
  });

/** Owner only: departures carry capacity and prices (RLS enforces it too). */
export async function createDeparture(tourId: string, form: FormData) {
  const staff = await assertStaff("owner");
  const back = `/admin/excursiones/${tourId}#salidas`;
  const parsed = departureSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) backWith(back, { error: firstError(parsed.error) });
  const d = parsed.data;
  if (new Date(d.startsAt) <= new Date()) backWith(back, { error: "La fecha ya ha pasado." });

  const db = await createClient();
  const { data, error } = await db
    .from("tour_departures")
    .insert({
      tour_id: tourId,
      starts_at: d.startsAt,
      ends_at: d.endsAt,
      capacity: d.capacity,
      price_cents: d.priceCents,
    })
    .select("id")
    .single();
  if (error)
    backWith(back, {
      error:
        error.code === "23505"
          ? "Ya hay una salida a esa hora."
          : `No se pudo crear: ${error.message}`,
    });

  await audit(staff.id, "departure.create", "tour_departures", data!.id, { tourId, ...d });
  updateTag(TOURS_TAG);
  backWith(back, { ok: "salida_creada" });
}

export async function updateDeparture(tourId: string, departureId: string, form: FormData) {
  const staff = await assertStaff("owner");
  const back = `/admin/excursiones/${tourId}#salidas`;
  const parsed = departureSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) backWith(back, { error: firstError(parsed.error) });
  const d = parsed.data;

  const db = await createClient();
  const { data: current } = await db
    .from("tour_departures")
    .select("seats_taken, status")
    .eq("id", departureId)
    .single();
  if (!current) backWith(back, { error: "Salida no encontrada." });
  if (current.status === "cancelled") backWith(back, { error: "La salida está cancelada." });
  if (d.capacity < current.seats_taken)
    backWith(back, {
      error: `No puedes bajar a ${d.capacity} plazas: ya hay ${current.seats_taken} ocupadas o retenidas.`,
    });

  // Full means sold out; extra capacity reopens sales unless the owner closed them.
  const status = d.capacity <= current.seats_taken ? "sold_out" : (d.status ?? "open");
  const { error } = await db
    .from("tour_departures")
    .update({
      starts_at: d.startsAt,
      ends_at: d.endsAt,
      capacity: d.capacity,
      price_cents: d.priceCents,
      status,
    })
    .eq("id", departureId);
  if (error) backWith(back, { error: `No se pudo guardar: ${error.message}` });

  await audit(staff.id, "departure.update", "tour_departures", departureId, { ...d, status });
  updateTag(TOURS_TAG);
  backWith(back, { ok: "guardado" });
}

/** Cancel a departure: refunds every paid booking and emails customers (US-22). */
export async function cancelDepartureAction(tourId: string, departureId: string, form: FormData) {
  const staff = await assertStaff("owner");
  const back = `/admin/excursiones/${tourId}#salidas`;
  if (form.get("confirm") !== "on")
    backWith(back, { error: "Marca la casilla de confirmación para cancelar la salida." });

  const report = await cancelDeparture(departureId);
  await audit(staff.id, "departure.cancel", "tour_departures", departureId, report);
  updateTag(TOURS_TAG);
  if (report.failed.length)
    backWith(back, {
      error: `Salida cancelada, pero ${report.failed.length} reembolso(s) fallaron: ${report.failed
        .map((f) => `${f.reference} (${f.error})`)
        .join(", ")}. Vuelve a cancelar para reintentarlo o revísalo en Redsys.`,
    });
  backWith(back, { ok: "salida_cancelada" });
}

const uuid = z.string().uuid();

async function nextImageOrder(db: Awaited<ReturnType<typeof createClient>>, tourId: string) {
  const { data } = await db
    .from("tour_images")
    .select("sort_order")
    .eq("tour_id", tourId)
    .order("sort_order", { ascending: false })
    .limit(1);
  return (data?.[0]?.sort_order ?? -1) + 1;
}

/** Adds a photo to a tour: a new upload, or an image already in Medios. */
export async function addTourImage(tourId: string, form: FormData) {
  const staff = await assertStaff("any");
  const back = `/admin/excursiones/${tourId}#fotos`;
  const db = await createClient();

  let mediaId: string;
  let path: string;
  let altText: string | null;
  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    const stored = await storeImage(db, file, form.get("alt"));
    if ("error" in stored) backWith(back, { error: stored.error });
    await audit(staff.id, "media.upload", "media", stored.id, { path: stored.path });
    mediaId = stored.id;
    path = stored.path;
    altText = String(form.get("alt")).trim();
  } else {
    const picked = uuid.safeParse(form.get("media_id"));
    if (!picked.success) backWith(back, { error: "Sube una foto o elige una de Medios." });
    const { data: media } = await db
      .from("media")
      .select("id, path, alt")
      .eq("id", picked.data)
      .maybeSingle();
    if (!media) backWith(back, { error: "Esa imagen ya no está en Medios." });
    mediaId = media.id;
    path = media.path;
    altText = media.alt;
  }

  const { data, error } = await db
    .from("tour_images")
    .insert({
      tour_id: tourId,
      media_id: mediaId,
      storage_path: path,
      alt: altText,
      sort_order: await nextImageOrder(db, tourId),
    })
    .select("id")
    .single();
  if (error) backWith(back, { error: `No se pudo añadir: ${error.message}` });
  await audit(staff.id, "tour.image_add", "tour_images", data.id, { tourId, mediaId });
  updateTag(TOURS_TAG);
  backWith(back, { ok: "foto_anadida" });
}

/** Takes a photo off the tour. The image stays in Medios. */
export async function removeTourImage(tourId: string, imageId: string) {
  const staff = await assertStaff("any");
  const back = `/admin/excursiones/${tourId}#fotos`;
  const db = await createClient();
  const { error } = await db.from("tour_images").delete().eq("id", imageId).eq("tour_id", tourId);
  if (error) backWith(back, { error: `No se pudo quitar: ${error.message}` });
  await audit(staff.id, "tour.image_remove", "tour_images", imageId, { tourId });
  updateTag(TOURS_TAG);
  backWith(back, { ok: "foto_quitada" });
}

/** Makes a photo the tour's main one (first in the gallery). */
export async function setTourCover(tourId: string, imageId: string) {
  const staff = await assertStaff("any");
  const back = `/admin/excursiones/${tourId}#fotos`;
  const db = await createClient();
  const { data: first } = await db
    .from("tour_images")
    .select("sort_order")
    .eq("tour_id", tourId)
    .order("sort_order")
    .limit(1);
  const { error } = await db
    .from("tour_images")
    .update({ sort_order: (first?.[0]?.sort_order ?? 0) - 1 })
    .eq("id", imageId)
    .eq("tour_id", tourId);
  if (error) backWith(back, { error: `No se pudo cambiar: ${error.message}` });
  await audit(staff.id, "tour.image_cover", "tour_images", imageId, { tourId });
  updateTag(TOURS_TAG);
  backWith(back, { ok: "foto_portada" });
}
