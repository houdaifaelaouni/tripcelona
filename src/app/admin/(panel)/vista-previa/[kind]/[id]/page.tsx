import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@/components/content/rich-text";
import { Badge } from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/staff";
import { sanitizeDoc } from "@/lib/content/rich-text";
import { getSiteSettings, legalTokens } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/tours/media";

export const metadata: Metadata = { title: "Vista previa" };

/** FR-83: staff-only preview of the saved version, drafts included. */
export default async function Preview({ params }: PageProps<"/admin/vista-previa/[kind]/[id]">) {
  await requireStaff();
  const { kind, id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || (kind !== "blog" && kind !== "paginas")) notFound();
  const db = await createClient();

  let title: string;
  let status: string;
  let content: unknown;
  let cover: { url: string; alt: string } | null = null;
  let legal = false;
  if (kind === "blog") {
    const { data } = await db
      .from("posts")
      .select("title, status, content, media:cover_id ( bucket, path, source_url, alt )")
      .eq("id", id)
      .maybeSingle();
    if (!data) notFound();
    ({ title, status, content } = data);
    const url = mediaUrl(data.media);
    cover = url ? { url, alt: data.media?.alt ?? "" } : null;
  } else {
    const { data } = await db
      .from("pages")
      .select("title, status, content, kind")
      .eq("id", id)
      .maybeSingle();
    if (!data) notFound();
    ({ title, status, content } = data);
    legal = data.kind === "legal";
  }
  const tokens = legal ? legalTokens(await getSiteSettings()) : {};

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Badge tone={status === "published" ? "success" : "accent"}>
          Vista previa ·{" "}
          {status === "published" ? "publicado" : status === "draft" ? "borrador" : "archivado"}
        </Badge>
        <Link href={`/admin/${kind}/${id}`} className="text-sm text-blue underline">
          Volver a editar
        </Link>
      </div>
      <article className="rounded-panel border border-border bg-white p-5 md:p-8">
        <h1 className="text-3xl">{title}</h1>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt={cover.alt}
            className="mt-6 max-h-96 w-full max-w-4xl rounded-panel object-cover"
          />
        )}
        <RichText className="mt-6" doc={sanitizeDoc(content)} tokens={tokens} />
      </article>
    </>
  );
}
