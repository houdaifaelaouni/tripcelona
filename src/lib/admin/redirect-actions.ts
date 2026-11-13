"use server";

import { z } from "zod";
import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { safeHref } from "@/lib/content/rich-text";
import { createClient } from "@/lib/supabase/server";
import { backWith } from "./redirect";

const BACK = "/admin/redirecciones";

const schema = z.object({
  from_path: z
    .string()
    .trim()
    .max(300)
    .transform((v) => v.replace(/\/+$/, "") || "/")
    .refine(
      (v) => /^\/[^\s?#]*$/.test(v),
      "La URL antigua debe empezar por / y no llevar espacios ni ?",
    ),
  to_path: z.string().trim().max(500),
  status_code: z.coerce.number().refine((n) => [301, 302, 307, 308, 410].includes(n)),
});

export async function saveRedirect(formData: FormData) {
  const staff = await assertStaff("owner");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    backWith(BACK, { error: parsed.error.issues[0]?.message ?? "Datos no válidos." });
  const { from_path, status_code } = parsed.data;
  let to_path = parsed.data.to_path;

  if (status_code === 410) {
    to_path = "";
  } else {
    const safe = safeHref(to_path);
    if (!safe)
      backWith(BACK, { error: "El destino debe ser una dirección de la web (/blog) o https://…" });
    to_path = safe;
    if (to_path.replace(/\/+$/, "") === from_path)
      backWith(BACK, { error: "El destino no puede ser la misma dirección." });
  }
  if (from_path === "/" || from_path.startsWith("/admin") || from_path.startsWith("/api"))
    backWith(BACK, { error: "Esa dirección no se puede redirigir." });

  const db = await createClient();
  const { error } = await db
    .from("redirects")
    .upsert({ from_path, to_path, status_code }, { onConflict: "from_path" });
  if (error) backWith(BACK, { error: `No se pudo guardar: ${error.message}` });
  await audit(staff.id, "redirect.save", "redirects", null, { from_path, to_path, status_code });
  backWith(BACK, { ok: "guardado" });
}

export async function deleteRedirect(id: string) {
  const staff = await assertStaff("owner");
  const db = await createClient();
  const { error } = await db.from("redirects").delete().eq("id", id);
  if (error) backWith(BACK, { error: `No se pudo eliminar: ${error.message}` });
  await audit(staff.id, "redirect.delete", "redirects", id);
  backWith(BACK, { ok: "eliminado" });
}
