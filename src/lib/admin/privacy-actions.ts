"use server";

import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookingCanBeAnonymised } from "./privacy";
import { backWith } from "./redirect";

/**
 * GDPR art. 17: erase a person's data on request. Rows are anonymised, not
 * deleted, so booking references, amounts and dates stay for the accounts
 * (the privacy policy keeps those for the legal tax period). Only the owner
 * can do it, it needs a ticked confirmation, and it is recorded in the
 * activity log without the erased values.
 *
 * Copies outside this database (the payment provider and the email
 * provider) are not reached from here: see docs/legal/data-requests.md.
 */

const ERASED = "Anonimizado";
const erasedEmail = (key: string) => `anonimizado-${key}@invalid.invalid`;

function needsConfirm(form: FormData, back: string) {
  if (form.get("confirm") !== "on")
    backWith(back, { error: "Marca la casilla para confirmar la anonimización." });
}

export async function anonymiseBookingAction(bookingId: string, form: FormData) {
  const staff = await assertStaff("owner");
  const back = `/admin/reservas/${bookingId}`;
  needsConfirm(form, back);
  const db = createAdminClient();

  const { data: b } = await db
    .from("bookings")
    .select("reference, status, tour_departures(starts_at)")
    .eq("id", bookingId)
    .single();
  if (!b) backWith(back, { error: "Reserva no encontrada." });
  if (!bookingCanBeAnonymised(b.status, b.tour_departures?.starts_at))
    backWith(back, {
      error:
        "Solo se pueden anonimizar reservas canceladas, reembolsadas o de excursiones ya hechas.",
    });

  const { error } = await db
    .from("bookings")
    .update({
      customer_name: ERASED,
      email: erasedEmail(b.reference.toLowerCase()),
      phone: null,
      pickup_note: null,
      notes: null,
    })
    .eq("id", bookingId);
  if (error) backWith(back, { error: `No se pudo anonimizar: ${error.message}` });

  // Provider payloads can hold the payer's name and email.
  const { data: pays } = await db
    .from("payments")
    .select("provider, provider_ref")
    .eq("booking_id", bookingId);
  await db.from("payments").update({ raw_event: null }).eq("booking_id", bookingId);
  for (const p of pays ?? []) {
    await db
      .from("payment_events")
      .update({ payload: { anonymised: true } })
      .eq("provider", p.provider)
      .eq("provider_ref", p.provider_ref);
  }
  await db.from("booking_travellers").delete().eq("booking_id", bookingId);

  await audit(staff.id, "privacy.anonymise", "bookings", bookingId, { reference: b.reference });
  backWith(back, { ok: "anonimizado" });
}

export async function anonymiseLeadAction(leadId: string, form: FormData) {
  const staff = await assertStaff("owner");
  const back = `/admin/solicitudes/mensajes/${leadId}`;
  needsConfirm(form, back);
  const { error } = await createAdminClient()
    .from("leads")
    .update({
      payload: { name: ERASED, email: erasedEmail(leadId.slice(0, 8)), anonymised: true },
      admin_notes: null,
      email_error: null,
    })
    .eq("id", leadId);
  if (error) backWith(back, { error: `No se pudo anonimizar: ${error.message}` });
  await audit(staff.id, "privacy.anonymise", "leads", leadId);
  backWith(back, { ok: "anonimizado" });
}

export async function anonymiseRequestAction(requestId: string, form: FormData) {
  const staff = await assertStaff("owner");
  const back = `/admin/solicitudes/${requestId}`;
  needsConfirm(form, back);
  const { error } = await createAdminClient()
    .from("tour_requests")
    .update({
      name: ERASED,
      email: erasedEmail(requestId.slice(0, 8)),
      phone: null,
      company: null,
      budget: null,
      message: null,
      admin_notes: null,
      email_error: null,
    })
    .eq("id", requestId);
  if (error) backWith(back, { error: `No se pudo anonimizar: ${error.message}` });
  await audit(staff.id, "privacy.anonymise", "tour_requests", requestId);
  backWith(back, { ok: "anonimizado" });
}
