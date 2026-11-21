"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { sendBookingEmail } from "@/lib/email/booking-emails";
import { isLocale, localizePath } from "@/lib/i18n/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { newTicketCode } from "./codes";
import { getTicketBundle } from "./queries";

export type TravellersState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors: Record<string, string>;
      values: Record<string, string>;
    };

const name = z
  .string()
  .trim()
  .min(3, "Escribe nombre y apellidos.")
  .max(80, "Máximo 80 caracteres.");
const document = z
  .string()
  .trim()
  .transform((v) => v.toUpperCase().replace(/[\s.-]/g, ""))
  .pipe(z.string().regex(/^[A-Z0-9]{5,20}$/, "DNI, NIE o pasaporte: solo letras y números."));
const phone = z
  .string()
  .trim()
  .max(30)
  .refine((v) => v === "" || /^\+?[\d\s]{9,20}$/.test(v), "Teléfono no válido.")
  .transform((v) => (v ? v : null));

/**
 * The customer's traveller form (after paying): one row per traveller of
 * every booking in the link. Keeps existing ticket codes when editing, so a
 * ticket already printed stays valid. Then emails the PDF tickets.
 */
export async function saveTravellers(
  _prev: TravellersState,
  form: FormData,
): Promise<TravellersState> {
  const bookingId = String(form.get("bookingId") ?? "");
  const rawLocale = String(form.get("locale") ?? "");
  const locale = isLocale(rawLocale) ? rawLocale : "es";
  const values = Object.fromEntries(
    [...form.entries()].filter(([k]) => k.startsWith("t_")).map(([k, v]) => [k, String(v)]),
  );

  const bundle = await getTicketBundle(bookingId);
  if (!bundle || bundle.anchor.status !== "paid")
    return { status: "error", message: "Esta reserva no está pagada.", fieldErrors: {}, values };
  if (!bundle.editable)
    return {
      status: "error",
      message: "La excursión ya ha salido: los datos no se pueden cambiar.",
      fieldErrors: {},
      values,
    };

  const fieldErrors: Record<string, string> = {};
  const rows: {
    booking_id: string;
    position: number;
    name: string;
    document_id: string;
    phone: string | null;
    ticket_code: string;
  }[] = [];
  for (const trip of bundle.trips) {
    for (let i = 1; i <= trip.travellers; i++) {
      const key = `t_${trip.bookingId}_${i}`;
      const n = name.safeParse(form.get(`${key}_name`) ?? "");
      const d = document.safeParse(form.get(`${key}_doc`) ?? "");
      const p = phone.safeParse(form.get(`${key}_phone`) ?? "");
      if (!n.success) fieldErrors[`${key}_name`] = n.error.issues[0].message;
      if (!d.success) fieldErrors[`${key}_doc`] = d.error.issues[0].message;
      if (!p.success) fieldErrors[`${key}_phone`] = p.error.issues[0].message;
      if (n.success && d.success && p.success) {
        const existing = trip.rows.find((r) => r.position === i);
        rows.push({
          booking_id: trip.bookingId,
          position: i,
          name: n.data,
          document_id: d.data,
          phone: p.data,
          ticket_code: existing?.ticketCode ?? newTicketCode(),
        });
      }
    }
  }
  if (Object.keys(fieldErrors).length)
    return { status: "error", message: "Revisa los campos marcados.", fieldErrors, values };

  const db = createAdminClient();
  const { error } = await db
    .from("booking_travellers")
    .upsert(rows, { onConflict: "booking_id,position" });
  if (error) {
    console.error("[tickets] save failed", error.message);
    return {
      status: "error",
      message: "No hemos podido guardar los datos. Inténtalo de nuevo en un momento.",
      fieldErrors: {},
      values,
    };
  }
  const ids = bundle.trips.map((t) => t.bookingId);
  for (const trip of bundle.trips)
    await db
      .from("booking_travellers")
      .delete()
      .eq("booking_id", trip.bookingId)
      .gt("position", trip.travellers);
  await db
    .from("bookings")
    .update({ travellers_completed_at: new Date().toISOString() })
    .in("id", ids);

  // A second save (edited names) sends the updated tickets again.
  await sendBookingEmail(bundle.anchor.id, "tickets", { force: true });

  redirect(localizePath(`/reservar/billetes?id=${bundle.anchor.id}&ok=1`, locale));
}
