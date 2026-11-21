"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { TOURS_TAG } from "@/lib/tours/queries";
import { backWith } from "./redirect";

/**
 * Itinerary stops ("Ruta del día") and per-tour FAQs. The public tour page
 * reads both (tour_itinerary, tour_faqs); before this they could only be
 * changed with SQL.
 */

const optional = (max: number) =>
  z
    .string()
    .max(max, `Máximo ${max} caracteres.`)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null));
const order = z
  .string()
  .optional()
  .transform((v) => (v?.trim() ? Number(v) : 0))
  .refine((v) => Number.isInteger(v) && v >= 0 && v < 1000, "Orden: número entero de 0 a 999.");

const stopSchema = z.object({
  title: z.string().trim().min(2, "La parada necesita un nombre.").max(160),
  time_label: optional(40),
  body: optional(2000),
  sort_order: order,
});

const faqSchema = z.object({
  question: z.string().trim().min(5, "Escribe la pregunta.").max(300),
  answer: z.string().trim().min(2, "Escribe la respuesta.").max(4000),
  sort_order: order,
});

const firstError = (e: z.ZodError) => e.issues[0]?.message ?? "Revisa el formulario.";
const isId = (v: string | null) => v === null || /^[0-9a-f-]{36}$/i.test(v);

/** Creates (stopId null) or updates one itinerary stop. */
export async function saveItineraryStop(tourId: string, stopId: string | null, form: FormData) {
  const staff = await assertStaff("any");
  const back = `/admin/excursiones/${tourId}#ruta`;
  if (!isId(tourId) || !isId(stopId)) backWith(back, { error: "Parada no válida." });
  const parsed = stopSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) backWith(back, { error: firstError(parsed.error) });
  const db = await createClient();
  const { data, error } = stopId
    ? await db
        .from("tour_itinerary")
        .update(parsed.data)
        .eq("id", stopId)
        .eq("tour_id", tourId)
        .select("id")
        .single()
    : await db
        .from("tour_itinerary")
        .insert({ ...parsed.data, tour_id: tourId })
        .select("id")
        .single();
  if (error || !data) backWith(back, { error: `No se pudo guardar: ${error?.message}` });
  await audit(
    staff.id,
    stopId ? "tour.stop_update" : "tour.stop_create",
    "tour_itinerary",
    data.id,
    {
      tourId,
      title: parsed.data.title,
    },
  );
  updateTag(TOURS_TAG);
  backWith(back, { ok: "guardado" });
}

export async function deleteItineraryStop(tourId: string, stopId: string) {
  const staff = await assertStaff("any");
  const back = `/admin/excursiones/${tourId}#ruta`;
  const db = await createClient();
  const { error } = await db.from("tour_itinerary").delete().eq("id", stopId).eq("tour_id", tourId);
  if (error) backWith(back, { error: `No se pudo borrar: ${error.message}` });
  // Its translations would be orphans otherwise.
  await db
    .from("content_translations")
    .delete()
    .eq("entity", "tour_itinerary")
    .eq("entity_id", stopId);
  await audit(staff.id, "tour.stop_delete", "tour_itinerary", stopId, { tourId });
  updateTag(TOURS_TAG);
  backWith(back, { ok: "eliminado" });
}

/** Creates (faqId null) or updates one FAQ of a tour. */
export async function saveTourFaq(tourId: string, faqId: string | null, form: FormData) {
  const staff = await assertStaff("any");
  const back = `/admin/excursiones/${tourId}#preguntas`;
  if (!isId(tourId) || !isId(faqId)) backWith(back, { error: "Pregunta no válida." });
  const parsed = faqSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) backWith(back, { error: firstError(parsed.error) });
  const db = await createClient();
  const { data, error } = faqId
    ? await db
        .from("tour_faqs")
        .update(parsed.data)
        .eq("id", faqId)
        .eq("tour_id", tourId)
        .select("id")
        .single()
    : await db
        .from("tour_faqs")
        .insert({ ...parsed.data, tour_id: tourId })
        .select("id")
        .single();
  if (error || !data) backWith(back, { error: `No se pudo guardar: ${error?.message}` });
  await audit(staff.id, faqId ? "tour.faq_update" : "tour.faq_create", "tour_faqs", data.id, {
    tourId,
  });
  updateTag(TOURS_TAG);
  backWith(back, { ok: "guardado" });
}

export async function deleteTourFaq(tourId: string, faqId: string) {
  const staff = await assertStaff("any");
  const back = `/admin/excursiones/${tourId}#preguntas`;
  const db = await createClient();
  const { error } = await db.from("tour_faqs").delete().eq("id", faqId).eq("tour_id", tourId);
  if (error) backWith(back, { error: `No se pudo borrar: ${error.message}` });
  await db.from("content_translations").delete().eq("entity", "tour_faq").eq("entity_id", faqId);
  await audit(staff.id, "tour.faq_delete", "tour_faqs", faqId, { tourId });
  updateTag(TOURS_TAG);
  backWith(back, { ok: "eliminado" });
}
