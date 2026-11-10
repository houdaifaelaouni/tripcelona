"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { createPendingBooking } from "@/lib/booking/create";
import { sendBookingEmail } from "@/lib/email/booking-emails";
import type { EmailKind } from "@/lib/email/templates";
import { refundBooking } from "@/lib/payments/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { TOURS_TAG } from "@/lib/tours/queries";
import { backWith } from "./redirect";

const KINDS: EmailKind[] = [
  "confirmation",
  "owner_alert",
  "payment_failed",
  "payment_request",
  "cancellation",
];

export async function resendBookingEmail(bookingId: string, form: FormData) {
  const staff = await assertStaff("owner");
  const back = `/admin/reservas/${bookingId}`;
  const kind = String(form.get("kind") ?? "confirmation") as EmailKind;
  if (!KINDS.includes(kind)) backWith(back, { error: "Tipo de email no válido." });

  const result = await sendBookingEmail(bookingId, kind, {
    force: true,
    refunded: kind === "cancellation",
    scope: "booking",
  });
  await audit(staff.id, "booking.email_resend", "bookings", bookingId, { kind, result });
  if (result !== "sent")
    backWith(back, {
      error:
        result === "no_recipient"
          ? "No hay destinatario (falta OWNER_EMAIL)."
          : "No se pudo enviar el email. Revisa la configuración de Resend.",
    });
  backWith(back, { ok: "reenviado" });
}

export async function refundBookingAction(bookingId: string, form: FormData) {
  const staff = await assertStaff("owner");
  const back = `/admin/reservas/${bookingId}`;
  if (form.get("confirm") !== "on")
    backWith(back, { error: "Marca la casilla para confirmar el reembolso." });

  const { data: booking } = await createAdminClient()
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .single();
  if (booking?.status !== "paid")
    backWith(back, { error: "Solo se pueden reembolsar reservas pagadas." });

  const result = await refundBooking(bookingId, {
    releaseSeats: true,
    notify: true,
    scope: "booking",
  });
  await audit(staff.id, "booking.refund", "bookings", bookingId, result);
  updateTag(TOURS_TAG);
  if (!result.ok) backWith(back, { error: `El reembolso falló: ${result.error}` });
  backWith(back, { ok: "reembolsado" });
}

export async function cancelPendingBooking(bookingId: string) {
  const staff = await assertStaff("owner");
  const back = `/admin/reservas/${bookingId}`;
  const db = createAdminClient();
  const { data: booking } = await db.from("bookings").select("status").eq("id", bookingId).single();
  if (booking?.status !== "pending")
    backWith(back, { error: "Solo se cancelan así las reservas pendientes." });

  await db.rpc("release_booking_seats", { p_booking_id: bookingId });
  await db
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("status", "pending");
  await audit(staff.id, "booking.cancel_pending", "bookings", bookingId);
  updateTag(TOURS_TAG);
  backWith(back, { ok: "cancelada" });
}

const manualSchema = z.object({
  departureId: z.uuid({ error: "Elige una salida." }),
  travellers: z.coerce.number().int().min(1, "Mínimo 1 viajero.").max(60),
  name: z.string().trim().min(2, "Escribe el nombre del cliente."),
  email: z.email({ error: "Email no válido." }).trim(),
  phone: z.string().trim().max(30).optional().default(""),
  pickupNote: z.string().trim().max(500).optional().default(""),
  payment: z.enum(["cash", "transfer", "pending"]),
  notify: z.string().optional(),
});

/**
 * Phone/WhatsApp bookings (US-26). Same seat rules as the website. Paid in
 * cash or by transfer: confirmed immediately with a "manual" payment row.
 * Pending: the customer gets the normal payment link instead.
 */
export async function createManualBooking(form: FormData) {
  const staff = await assertStaff("owner");
  const parsed = manualSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    backWith("/admin/reservas/nueva", {
      error: parsed.error.issues[0]?.message ?? "Revisa el formulario.",
    });
  const input = parsed.data;

  const created = await createPendingBooking(input);
  if (!created.ok) backWith("/admin/reservas/nueva", { error: created.message });

  const db = createAdminClient();
  if (input.payment !== "pending") {
    const { data: confirmed } = await db.rpc("confirm_hold", {
      p_hold_id: created.holdId,
      p_booking_id: created.bookingId,
    });
    if (!confirmed)
      backWith(`/admin/reservas/${created.bookingId}`, {
        error: "No se pudo confirmar las plazas.",
      });
    await db.from("payments").insert({
      booking_id: created.bookingId,
      provider: "manual",
      provider_ref: `${input.payment}-${created.reference}`,
      amount_cents: created.totalCents,
      status: "succeeded",
      raw_event: { method: input.payment, recorded_by: staff.email },
    });
    await db
      .from("bookings")
      .update({
        status: "paid",
        notes: `Pago manual: ${input.payment === "cash" ? "efectivo" : "transferencia"}`,
      })
      .eq("id", created.bookingId);
    if (input.notify === "on") await sendBookingEmail(created.bookingId, "confirmation");
  } else {
    // Keep the seats for 24 h while the customer pays through the link.
    await db
      .from("seat_holds")
      .update({ expires_at: new Date(Date.now() + 24 * 3600_000).toISOString() })
      .eq("id", created.holdId);
    if (input.notify === "on") await sendBookingEmail(created.bookingId, "payment_request");
  }

  await audit(staff.id, "booking.manual_create", "bookings", created.bookingId, {
    reference: created.reference,
    payment: input.payment,
    travellers: input.travellers,
  });
  updateTag(TOURS_TAG);
  backWith(`/admin/reservas/${created.bookingId}`, { ok: "creada" });
}
