import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/admin/button";
import { Input, Select, Textarea } from "@/components/admin/fields";
import { Flash } from "@/components/admin/flash";
import { PageTitle, Panel, TourStatus } from "@/components/admin/ui";
import { deleteLanding, updateLanding } from "@/lib/admin/landing-actions";
import { requireStaff } from "@/lib/auth/staff";
import { siteUrl } from "@/lib/seo/site-url";
import { createClient } from "@/lib/supabase/server";
import { DESIGNS } from "@/components/landings/designs";

export const metadata: Metadata = { title: "Landing" };

export default async function LandingEdit({
  params,
  searchParams,
}: PageProps<"/admin/landings/[id]">) {
  await requireStaff("any");
  const { id } = await params;
  const { ok, error } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await createClient();
  const [{ data: l }, { data: tours }] = await Promise.all([
    db
      .from("landing_pages")
      .select("id, slug, title, brief, tour_id, status")
      .eq("id", id)
      .maybeSingle(),
    db.from("tours").select("id, title").eq("status", "published").order("title"),
  ]);
  if (!l) notFound();
  const url = `${siteUrl()}/l/${l.slug}`;
  const designed = !!DESIGNS[l.slug];

  return (
    <>
      <PageTitle
        crumbs={[{ label: "Landings", href: "/admin/landings" }, { label: l.title }]}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <TourStatus status={l.status} />
            <span>{designed ? "Con diseño a medida" : "Diseño básico (pendiente de diseñar)"}</span>
          </span>
        }
        actions={
          <a
            href={`/l/${l.slug}?vista=${l.id}`}
            target="_blank"
            rel="noopener"
            className="text-sm font-semibold text-brand-secondary hover:underline"
          >
            Vista previa ↗
          </a>
        }
      >
        {l.title}
      </PageTitle>
      <Flash ok={ok} error={error} />

      <Panel
        title="Datos"
        description={
          l.status === "published" ? (
            <>
              Publicada en <span className="font-mono text-xs">{url}</span>. Para los anuncios, crea
              el enlace con UTM en Integraciones.
            </>
          ) : (
            "Borrador: solo se ve con el enlace de vista previa."
          )
        }
      >
        <form action={updateLanding} className="grid gap-4 px-4 pb-5 md:grid-cols-2 md:px-5">
          <input type="hidden" name="id" value={l.id} />
          <Input label="Título" name="title" required maxLength={140} defaultValue={l.title} />
          <Input
            label="Dirección"
            name="slug"
            maxLength={80}
            defaultValue={l.slug}
            hint="Cambiarla rompe los anuncios que ya usan la antigua."
          />
          <Select label="Excursión que vende" name="tour_id" defaultValue={l.tour_id ?? ""}>
            <option value="">Ninguna (enlaza al catálogo)</option>
            {(tours ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </Select>
          <Select label="Estado" name="status" defaultValue={l.status}>
            <option value="draft">Borrador</option>
            <option value="published">Publicada</option>
            <option value="archived">Archivada</option>
          </Select>
          <Textarea
            label="Brief para el diseño"
            name="brief"
            rows={5}
            maxLength={2000}
            defaultValue={l.brief ?? ""}
            className="md:col-span-2"
          />
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </Panel>

      <form action={deleteLanding} className="mt-6 flex justify-end">
        <input type="hidden" name="id" value={l.id} />
        <Button type="submit" variant="danger">
          Eliminar landing
        </Button>
      </form>
    </>
  );
}
