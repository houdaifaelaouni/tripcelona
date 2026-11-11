import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/admin/flash";
import { PageTitle, Panel, Table, TourStatus, td, th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPage } from "@/lib/admin/content-actions";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { formatDateShort } from "@/lib/tours/format";

export const metadata: Metadata = { title: "Páginas" };

export default async function PagesAdmin({ searchParams }: PageProps<"/admin/paginas">) {
  await requireStaff();
  const { ok, error } = await searchParams;
  const db = await createClient();
  const { data: pages } = await db
    .from("pages")
    .select("id, title, slug, kind, status, updated_at")
    .order("kind")
    .order("title");

  return (
    <>
      <PageTitle
        actions={
          <form action={createPage}>
            <Button type="submit">Nueva página</Button>
          </form>
        }
      >
        Páginas
      </PageTitle>
      <Flash ok={ok} error={error} />
      <Panel>
        <Table>
          <thead>
            <tr>
              <th className={th}>Página</th>
              <th className={th}>Tipo</th>
              <th className={th}>Última edición</th>
              <th className={th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {(pages ?? []).map((p) => (
              <tr key={p.id}>
                <td className={td}>
                  <Link
                    className="font-semibold text-blue underline"
                    href={`/admin/paginas/${p.id}`}
                  >
                    {p.title}
                  </Link>
                  <div className="text-caption text-muted">/{p.slug}</div>
                </td>
                <td className={td}>
                  {p.kind === "legal" ? <Badge tone="brand">Legal</Badge> : "Página"}
                </td>
                <td className={td}>{formatDateShort(p.updated_at)}</td>
                <td className={td}>
                  <TourStatus status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
