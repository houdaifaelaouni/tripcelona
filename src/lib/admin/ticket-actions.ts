"use server";

import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { backWith } from "./redirect";

/** Staff at the bus door: mark a ticket as boarded (or undo a mistake). */
export async function setCheckin(form: FormData) {
  const staff = await assertStaff("any");
  const code = String(form.get("code") ?? "");
  const undo = form.get("undo") === "1";
  const back = `/admin/billetes/${code}`;
  if (!/^[A-Z0-9]{10}$/.test(code)) backWith("/admin", { error: "Código de billete no válido." });
  const { data, error } = await createAdminClient()
    .from("booking_travellers")
    .update(
      undo
        ? { checked_in_at: null, checked_in_by: null }
        : { checked_in_at: new Date().toISOString(), checked_in_by: staff.id },
    )
    .eq("ticket_code", code)
    .select("id")
    .maybeSingle();
  if (error || !data) backWith(back, { error: "No se pudo actualizar el billete." });
  await audit(
    staff.id,
    undo ? "ticket.checkin_undo" : "ticket.checkin",
    "booking_travellers",
    data.id,
  );
  backWith(back, { ok: undo ? "checkin_deshecho" : "embarcado" });
}
