import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentForm } from "@/components/admin/content-form";
import { Flash } from "@/components/admin/flash";
import { PageTitle } from "@/components/admin/ui";
import { savePage } from "@/lib/admin/content-actions";
import { mediaOptions } from "@/lib/admin/media-options";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar página" };

export default async function PageEdit({ params, searchParams }: PageProps<"/admin/paginas/[id]">) {
  const staff = await requireStaff();
  const { id } = await params;
  const { ok, error } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await createClient();
  const { data: page } = await db.from("pages").select("*").eq("id", id).maybeSingle();
  if (!page) notFound();
  const media = await mediaOptions();
  const legal = page.kind === "legal";

  return (
    <>
      <PageTitle>{page.title}</PageTitle>
      <Flash ok={ok} error={error} />
      {legal && staff.role === "owner" && (
        <p role="note" className="mb-4 rounded-card border border-border bg-white p-3 text-meta">
          Página legal. Los textos <code>[tripola dato=&quot;…&quot;]</code> se rellenan con los
          datos de <b>Ajustes → Datos legales</b>.
        </p>
      )}
      <ContentForm
        kind="page"
        action={savePage.bind(null, page.id)}
        values={page}
        media={media}
        publicPath={`/${page.slug}`}
        previewHref={`/admin/vista-previa/paginas/${page.id}`}
        canSetKind={staff.role === "owner"}
        readOnly={
          legal && staff.role !== "owner"
            ? "Página legal: solo el propietario puede modificarla."
            : undefined
        }
      />
    </>
  );
}
