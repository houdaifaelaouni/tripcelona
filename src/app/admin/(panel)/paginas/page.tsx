import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/admin/flash";
import { PageTitle, Panel, ResultCount, Table, TourStatus, td, th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/admin/button";
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
        description="Sobre nosotros y las páginas legales."
      >
        Páginas
      </PageTitle>
      <Flash ok={ok} error={error} />
      <Panel
        title="Páginas"
        footer={<ResultCount count={pages?.length ?? 0} one="página" many="páginas" />}
      >
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
                    className="font-semibold text-brand-secondary hover:underline"
                    href={`/admin/paginas/${p.id}`}
                  >
                    {p.title}
                  </Link>
                  <div className="text-xs text-tertiary">/{p.slug}</div>
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
