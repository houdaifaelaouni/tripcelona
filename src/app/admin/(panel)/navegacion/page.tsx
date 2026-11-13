import type { Metadata } from "next";
import { Flash } from "@/components/admin/flash";
import { SettingsRow } from "@/components/admin/settings";
import { PageTitle, SectionHeader } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/admin/button";
import { Textarea } from "@/components/admin/fields";
import { resetNavigation, saveNavigation } from "@/lib/admin/site-content-actions";
import { requireStaff } from "@/lib/auth/staff";
import { contentFromRows } from "@/lib/site-content";
import { footerToText, navToText } from "@/lib/site-content-shared";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Menú y pie de página" };

/** Header menu and footer link columns, editable without code changes. */
export default async function NavigationAdmin({ searchParams }: PageProps<"/admin/navegacion">) {
  await requireStaff("any");
  const { ok, error } = await searchParams;
  const db = await createClient();
  const { data } = await db.from("settings").select("key, value");
  const { nav, footer } = contentFromRows(data ?? []);

  return (
    <>
      <PageTitle crumbs={[{ label: "Contenido" }, { label: "Menú y pie" }]}>
        Menú y pie de página
      </PageTitle>
      <Flash ok={ok} error={error} />
      <form action={saveNavigation}>
        <SectionHeader
          title="Enlaces de la web"
          description="Un enlace por línea. Usa direcciones de la web (/blog) o completas (https://…)."
          actions={
            <>
              <Button type="submit" variant="secondary" formAction={resetNavigation} formNoValidate>
                Restaurar originales
              </Button>
              <ButtonLink href="/admin/navegacion" variant="secondary">
                Descartar
              </ButtonLink>
              <Button type="submit">Guardar cambios</Button>
            </>
          }
        />
        <SettingsRow
          label="Menú superior"
          description="Entre 2 y 8 enlaces. Una línea que empieza por «- » es un submenú del enlace anterior."
        >
          <Textarea
            label="Menú"
            hideLabel
            name="nav"
            defaultValue={navToText(nav)}
            required
            rows={12}
            className="font-mono"
            hint="Formato: «Texto | enlace»"
          />
        </SettingsRow>
        <SettingsRow
          label="Pie de página"
          description="Hasta 6 columnas. Cada columna empieza con «# Título» y sigue con sus enlaces."
        >
          <Textarea
            label="Columnas del pie"
            hideLabel
            name="footer"
            defaultValue={footerToText(footer)}
            required
            rows={18}
            className="font-mono"
            hint="Formato: «# Título de columna» y debajo «Texto | enlace»"
          />
        </SettingsRow>
      </form>
    </>
  );
}
