import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentForm } from "@/components/admin/content-form";
import { Flash } from "@/components/admin/flash";
import { PageTitle, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { deletePost, savePost } from "@/lib/admin/content-actions";
import { mediaOptions } from "@/lib/admin/media-options";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar entrada" };

export default async function PostEdit({ params, searchParams }: PageProps<"/admin/blog/[id]">) {
  const staff = await requireStaff();
  const { id } = await params;
  const { ok, error } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await createClient();
  const { data: post } = await db.from("posts").select("*").eq("id", id).maybeSingle();
  if (!post) notFound();
  const media = await mediaOptions();

  return (
    <>
      <PageTitle>{post.title}</PageTitle>
      <Flash ok={ok} error={error} />
      <ContentForm
        kind="post"
        action={savePost.bind(null, post.id)}
        values={post}
        media={media}
        publicPath={`/blog/${post.slug}`}
        previewHref={`/admin/vista-previa/blog/${post.id}`}
      />
      {staff.role === "owner" && (
        <Panel title="Eliminar">
          <form
            action={deletePost.bind(null, post.id)}
            className="flex flex-wrap items-center gap-3"
          >
            <p className="text-meta text-muted">
              Borra la entrada para siempre. Si solo quieres ocultarla, archívala.
            </p>
            <Button type="submit" variant="outline">
              Eliminar entrada
            </Button>
          </form>
        </Panel>
      )}
    </>
  );
}
