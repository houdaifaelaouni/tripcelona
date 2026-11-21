"use server";

import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { isReference } from "@/lib/tickets/codes";
import { createAdminClient } from "@/lib/supabase/admin";
import { backWith } from "./redirect";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Staff at the bus door: mark passengers of a booking as boarded (one, or
 * all with `all=1`), or undo a mistake with `undo=1`.
 */
export async function setCheckin(form: FormData) {
  const staff = await assertStaff("any");
  const ref = String(form.get("ref") ?? "");
  if (!isReference(ref)) backWith("/admin", { error: "Referencia no válida." });
  const back = `/admin/billetes/${ref}`;
  const undo = form.get("undo") === "1";
  const all = form.get("all") === "1";
  const travellerId = String(form.get("traveller") ?? "");
  if (!all && !UUID.test(travellerId)) backWith(back, { error: "Pasajero no válido." });

  const db = createAdminClient();
  const { data: booking } = await db
    .from("bookings")
    .select("id")
    .eq("reference", ref)
    .maybeSingle();
  if (!booking) backWith(back, { error: "Reserva no encontrada." });
  let q = db
    .from("booking_travellers")
    .update(
      undo
        ? { checked_in_at: null, checked_in_by: null }
        : { checked_in_at: new Date().toISOString(), checked_in_by: staff.id },
    )
    .eq("booking_id", booking.id);
  q = all ? q.is("checked_in_at", null) : q.eq("id", travellerId);
  const { error } = await q;
  if (error) backWith(back, { error: "No se pudo actualizar el embarque." });
  await audit(staff.id, undo ? "ticket.checkin_undo" : "ticket.checkin", "bookings", booking.id, {
    all,
  });
  backWith(back, { ok: undo ? "checkin_deshecho" : "embarcado" });
}
