import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/admin/flash";
import { PageTitle, Panel, Table, TourStatus, td, th } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { createPost } from "@/lib/admin/content-actions";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { formatDateShort } from "@/lib/tours/format";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogAdmin({ searchParams }: PageProps<"/admin/blog">) {
  await requireStaff();
  const { ok, error } = await searchParams;
  const db = await createClient();
  const { data: posts } = await db
    .from("posts")
    .select("id, title, slug, status, published_at, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <>
      <PageTitle
        actions={
          <form action={createPost}>
            <Button type="submit">Nueva entrada</Button>
          </form>
        }
      >
        Blog
      </PageTitle>
      <Flash ok={ok} error={error} />
      <Panel>
        <Table>
          <thead>
            <tr>
              <th className={th}>Título</th>
              <th className={th}>Publicada</th>
              <th className={th}>Última edición</th>
              <th className={th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {(posts ?? []).map((p) => (
              <tr key={p.id}>
                <td className={td}>
                  <Link className="font-semibold text-blue underline" href={`/admin/blog/${p.id}`}>
                    {p.title}
                  </Link>
                  <div className="text-caption text-muted">/blog/{p.slug}</div>
                </td>
                <td className={td}>{p.published_at ? formatDateShort(p.published_at) : "—"}</td>
                <td className={td}>{formatDateShort(p.updated_at)}</td>
                <td className={td}>
                  <TourStatus status={p.status} />
                </td>
              </tr>
            ))}
            {(posts ?? []).length === 0 && (
              <tr>
                <td className={td} colSpan={4}>
                  Todavía no hay entradas.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
