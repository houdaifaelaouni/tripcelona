import type { Metadata } from "next";
import { Flash } from "@/components/admin/flash";
import { SettingsRow, SettingsTabs } from "@/components/admin/settings";
import { PageTitle, SectionHeader } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/admin/button";
import { Input, Switch, Textarea } from "@/components/admin/fields";
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
      <PageTitle crumbs={[{ label: "Ajustes" }]}>Ajustes</PageTitle>
      <SettingsTabs current="/admin/ajustes" role="owner" />
      <Flash ok={ok} error={error} />
      <form action={saveSettings}>
        <SectionHeader
          title="Perfil de la empresa"
          description="Datos de contacto, redes, aviso y datos legales que se muestran en la web."
          actions={
            <>
              <ButtonLink href="/admin/ajustes" variant="secondary">
                Descartar
              </ButtonLink>
              <Button type="submit">Guardar ajustes</Button>
            </>
          }
        />
        <SettingsRow label="Contacto" description="Teléfono, WhatsApp y email públicos.">
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
        </SettingsRow>
        <SettingsRow label="Punto de salida" description="Dónde se reúnen los grupos.">
          <Input
            label="Punto de salida"
            hideLabel
            name="meeting_point"
            defaultValue={s.meetingPoint}
            required
          />
        </SettingsRow>
        <SettingsRow
          label="Redes sociales"
          description="Solo se muestran en el pie de página las que tengan enlace."
        >
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
        </SettingsRow>
        <SettingsRow label="Aviso en la web" description="Una franja encima de la cabecera.">
          <Switch
            name="banner_active"
            defaultChecked={s.banner.active}
            label="Mostrar aviso encima de la cabecera"
          />
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
        </SettingsRow>
        <SettingsRow label="Formulario «Crea tu tour»" description="Opciones del presupuesto.">
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
        </SettingsRow>
        <SettingsRow
          label="Datos legales"
          description="Aparecen en el aviso legal, la privacidad y las condiciones (LSSI-CE art. 10). Mientras falten, esas páginas muestran «(pendiente)»."
        >
          <Input label="Titular" name="legal_titular" defaultValue={s.legal.titular ?? ""} />
          <Input label="NIF" name="legal_nif" defaultValue={s.legal.nif ?? ""} />
          <Input label="Domicilio" name="legal_domicilio" defaultValue={s.legal.domicilio ?? ""} />
        </SettingsRow>
        <div className="flex justify-end gap-3 pt-5">
          <ButtonLink href="/admin/ajustes" variant="secondary">
            Descartar
          </ButtonLink>
          <Button type="submit">Guardar ajustes</Button>
        </div>
      </form>
    </>
  );
}
