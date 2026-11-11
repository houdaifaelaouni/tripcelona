import type { Metadata } from "next";
import { Flash } from "@/components/admin/flash";
import { PageTitle, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input, Switch, Textarea } from "@/components/ui/field";
import { saveSettings } from "@/lib/admin/settings-actions";
import { requireStaff } from "@/lib/auth/staff";
import { SOCIAL_LABELS, SOCIAL_NETWORKS, settingsFromRows } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ajustes" };

/** FR-86: contact data, socials, banner, quote form options and legal identity. */
export default async function SettingsAdmin({ searchParams }: PageProps<"/admin/ajustes">) {
  await requireStaff("owner");
  const { ok, error } = await searchParams;
  const db = await createClient();
  const { data } = await db.from("settings").select("key, value");
  const s = settingsFromRows(data ?? []);

  return (
    <>
      <PageTitle>Ajustes</PageTitle>
      <Flash ok={ok} error={error} />
      <form action={saveSettings}>
        <Panel title="Contacto">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Teléfono" name="phone" defaultValue={s.phoneDisplay} required />
            <Input
              label="WhatsApp"
              name="whatsapp"
              defaultValue={s.whatsappDisplay}
              required
              hint="Con prefijo, p. ej. +34 …"
            />
            <Input
              label="Email de contacto"
              name="email"
              type="email"
              defaultValue={s.email ?? ""}
              hint="Se publica en la web. Usa una dirección de la empresa, no personal."
            />
            <Input
              label="Punto de salida"
              name="meeting_point"
              defaultValue={s.meetingPoint}
              required
            />
          </div>
        </Panel>

        <Panel title="Redes sociales">
          <div className="grid gap-4 md:grid-cols-2">
            {SOCIAL_NETWORKS.map((n) => (
              <Input
                key={n}
                label={SOCIAL_LABELS[n]}
                name={`social_${n}`}
                type="url"
                placeholder="https://"
                defaultValue={s.socials[n] ?? ""}
              />
            ))}
          </div>
          <p className="mt-2 text-meta text-muted">
            Solo se muestran en el pie de página las que tengan enlace.
          </p>
        </Panel>

        <Panel title="Aviso en la web">
          <div className="mb-4">
            <Switch
              name="banner_active"
              defaultChecked={s.banner.active}
              label="Mostrar aviso encima de la cabecera"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Texto del aviso"
              name="banner_text"
              maxLength={200}
              defaultValue={s.banner.text}
            />
            <Input
              label="Enlace (opcional)"
              name="banner_href"
              defaultValue={s.banner.href}
              hint="/ofertas-de-viajes o https://…"
            />
          </div>
        </Panel>

        <Panel title="Formulario «Crea tu tour»">
          <div className="grid gap-4 md:grid-cols-2">
            <Textarea
              label="Extras (uno por línea)"
              name="quote_extras"
              rows={6}
              defaultValue={s.quoteExtras.join("\n")}
            />
            <Textarea
              label="Nota sobre grupos"
              name="quote_note"
              rows={3}
              defaultValue={s.quoteNote ?? ""}
            />
          </div>
        </Panel>

        <Panel title="Datos legales">
          <p className="mb-4 text-meta text-muted">
            Aparecen en el aviso legal, la política de privacidad y las condiciones (LSSI-CE art.
            10). Mientras falten, esas páginas muestran «(pendiente)».
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Titular" name="legal_titular" defaultValue={s.legal.titular ?? ""} />
            <Input label="NIF" name="legal_nif" defaultValue={s.legal.nif ?? ""} />
            <Input
              label="Domicilio"
              name="legal_domicilio"
              defaultValue={s.legal.domicilio ?? ""}
            />
          </div>
        </Panel>

        <Button type="submit" size="lg">
          Guardar ajustes
        </Button>
      </form>
    </>
  );
}
