import type { Metadata } from "next";
import { Flash } from "@/components/admin/flash";
import { SettingsRow } from "@/components/admin/settings";
import { PageTitle, SectionHeader } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/admin/button";
import { Input, Textarea } from "@/components/admin/fields";
import { resetHomeContent, saveHomeContent } from "@/lib/admin/site-content-actions";
import { requireStaff } from "@/lib/auth/staff";
import { contentFromRows } from "@/lib/site-content";
import { pairsToText } from "@/lib/site-content-shared";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Página de inicio" };

/** Home page texts and Google title/description, editable without code changes. */
export default async function HomeContentAdmin({ searchParams }: PageProps<"/admin/inicio">) {
  await requireStaff("any");
  const { ok, error } = await searchParams;
  const db = await createClient();
  const { data } = await db.from("settings").select("key, value");
  const { home } = contentFromRows(data ?? []);

  return (
    <>
      <PageTitle crumbs={[{ label: "Contenido" }, { label: "Página de inicio" }]}>
        Página de inicio
      </PageTitle>
      <Flash ok={ok} error={error} />
      <form action={saveHomeContent}>
        <SectionHeader
          title="Textos de la portada"
          description="Cambia los textos de la página de inicio. Las fotos, las próximas salidas y los precios salen solos de tus excursiones."
          actions={
            <>
              <Button
                type="submit"
                variant="secondary"
                formAction={resetHomeContent}
                formNoValidate
              >
                Restaurar textos originales
              </Button>
              <ButtonLink href="/admin/inicio" variant="secondary">
                Descartar
              </ButtonLink>
              <Button type="submit">Guardar cambios</Button>
            </>
          }
        />
        <SettingsRow label="Portada" description="Lo primero que ve el visitante.">
          <Input
            label="Título principal"
            name="heroTitle"
            defaultValue={home.heroTitle}
            required
            maxLength={100}
          />
          <Textarea
            label="Texto bajo el título"
            name="heroLead"
            defaultValue={home.heroLead}
            required
            rows={3}
            maxLength={320}
          />
          <Input
            label="Vídeo de fondo (opcional)"
            name="heroVideoUrl"
            defaultValue={home.heroVideoUrl}
            maxLength={300}
            hint="Enlace a un .mp4 o .webm corto (10-20 s, sin sonido, menos de 8 MB), subido a Supabase Storage o a /public. Si lo dejas vacío se usa el vídeo gratuito de la Sagrada Família (Mixkit)."
          />
        </SettingsRow>
        <SettingsRow
          label="Por qué Tripcelona"
          description="Título y motivos, con su icono en el mismo orden."
        >
          <Input
            label="Título"
            name="whyTitle"
            defaultValue={home.whyTitle}
            required
            maxLength={120}
          />
          <Textarea
            label="Motivos"
            name="reasons"
            defaultValue={pairsToText(home.reasons)}
            required
            rows={8}
            hint="Una línea por motivo: «Título | texto». Entre 2 y 8."
          />
        </SettingsRow>
        <SettingsRow label="Cómo funciona" description="Los pasos para reservar.">
          <Input
            label="Título"
            name="stepsTitle"
            defaultValue={home.stepsTitle}
            required
            maxLength={100}
          />
          <Textarea
            label="Pasos"
            name="steps"
            defaultValue={pairsToText(home.steps)}
            required
            rows={6}
            hint="Una línea por paso: «Título | texto». Entre 3 y 6."
          />
        </SettingsRow>
        <SettingsRow label="Grupos" description="Bloque azul para empresas, colegios y amigos.">
          <Input
            label="Título"
            name="groupsTitle"
            defaultValue={home.groupsTitle}
            required
            maxLength={100}
          />
          <Textarea
            label="Puntos"
            name="groupPoints"
            defaultValue={home.groupPoints.join("\n")}
            required
            rows={4}
            hint="Una línea por punto. Entre 1 y 6."
          />
        </SettingsRow>
        <SettingsRow
          label="Google (SEO)"
          description="Cómo aparece la página de inicio en los resultados."
        >
          <Input
            label="Título (máx. 70)"
            name="seoTitle"
            defaultValue={home.seoTitle}
            required
            maxLength={70}
          />
          <Textarea
            label="Descripción (máx. 170)"
            name="seoDescription"
            defaultValue={home.seoDescription}
            required
            rows={3}
            maxLength={170}
          />
        </SettingsRow>
      </form>
    </>
  );
}
