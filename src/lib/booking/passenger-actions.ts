"use server";

import { redirect } from "next/navigation";
import { isLocale, localizePath } from "@/lib/i18n/config";
import { sendBookingEmail } from "@/lib/email/booking-emails";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBookingDetails } from "./details";
import { getTicketBundle } from "./passengers";

export type PassengerFormState = {
  status: "idle" | "error";
  message?: string;
  /** Field name → error message (Spanish source text, translated by the form). */
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

const clean = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Saves the passengers of a paid booking (every line of a cart), marks the
 * booking complete and emails the ticket. Editing later resends the ticket.
 */
export async function savePassengers(
  _prev: PassengerFormState,
  form: FormData,
): Promise<PassengerFormState> {
  const rawLocale = String(form.get("locale") ?? "");
  const locale = isLocale(rawLocale) ? rawLocale : "es";
  const booking = await getBookingDetails({ id: String(form.get("bookingId") ?? "") });
  if (!booking || booking.status !== "paid") {
    return { status: "error", message: "No encontramos esta reserva." };
  }
  const bundle = await getTicketBundle(booking);

  const errors: Record<string, string> = {};
  const values: Record<string, string> = {};
  const rows: {
    booking_id: string;
    name: string;
    document_id: string | null;
    position: number;
  }[] = [];
  for (const line of bundle.lines) {
    for (let i = 0; i < line.travellers; i++) {
      const nameKey = `name:${line.bookingId}:${i}`;
      const docKey = `doc:${line.bookingId}:${i}`;
      const name = clean(form.get(nameKey)).slice(0, 120);
      const doc = clean(form.get(docKey)).slice(0, 40);
      values[nameKey] = name;
      values[docKey] = doc;
      if (name.length < 2) errors[nameKey] = "Escribe el nombre y apellidos.";
      rows.push({ booking_id: line.bookingId, name, document_id: doc || null, position: i });
    }
  }
  if (Object.keys(errors).length) {
    return { status: "error", message: "Revisa los campos marcados.", errors, values };
  }

  const db = createAdminClient();
  const ids = bundle.lines.map((l) => l.bookingId);
  const del = await db.from("booking_travellers").delete().in("booking_id", ids);
  if (del.error) return { status: "error", message: "No hemos podido guardar los datos.", values };
  const ins = await db.from("booking_travellers").insert(rows);
  if (ins.error) return { status: "error", message: "No hemos podido guardar los datos.", values };
  await db
    .from("bookings")
    .update({ passengers_completed_at: new Date().toISOString() })
    .in("id", ids);

  // Every save sends the current ticket; a failed send still shows the ticket.
  await sendBookingEmail(booking.id, "ticket", { force: true }).catch((error) =>
    console.error(`[email] ticket for ${booking.reference} failed`, error),
  );
  redirect(localizePath(`/reservar/ticket?id=${booking.id}&enviado=1`, locale));
}
