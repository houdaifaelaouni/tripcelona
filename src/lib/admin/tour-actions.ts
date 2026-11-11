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
