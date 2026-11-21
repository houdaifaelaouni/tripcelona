import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/admin/button";
import { Input, Select, Textarea } from "@/components/admin/fields";
import { Flash } from "@/components/admin/flash";
import { EmptyState, PageTitle, Panel, Table, TourStatus, td, th } from "@/components/admin/ui";
import { createLanding } from "@/lib/admin/landing-actions";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Landings" };

/** Landing pages for ads: the media buyer names them, the owner designs them. */
export default async function Landings({ searchParams }: PageProps<"/admin/landings">) {
  await requireStaff("any");
  const { ok, error } = await searchParams;
  const db = await createClient();
  const [{ data: rows }, { data: tours }] = await Promise.all([
    db
      .from("landing_pages")
      .select("id, slug, title, status, created_at, tours(title)")
      .order("created_at", { ascending: false }),
    db.from("tours").select("id, title").eq("status", "published").order("title"),
  ]);

  return (
    <>
      <PageTitle description="Crea la página de un anuncio con solo el título. Sale como borrador con un diseño básico; luego se diseña a medida y se publica.">
        Landings
      </PageTitle>
      <Flash ok={ok} error={error} />

      <Panel title="Nueva landing">
        <form action={createLanding} className="grid gap-4 px-4 pb-5 md:grid-cols-2 md:px-5">
          <Input
            label="Título"
            name="title"
            required
            maxLength={140}
            placeholder="Mercado de Navidad de Andorra desde Barcelona"
          />
          <Input
            label="Dirección (opcional)"
            name="slug"
            maxLength={80}
            placeholder="navidad-andorra"
            hint="Se crea sola a partir del título. Quedará en tripcelona.com/l/…"
          />
          <Select label="Excursión que vende (opcional)" name="tour_id" defaultValue="">
            <option value="">Ninguna (enlaza al catálogo)</option>
            {(tours ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </Select>
          <Textarea
            label="Brief para el diseño (opcional)"
            name="brief"
            rows={3}
            maxLength={2000}
            placeholder="Público, oferta, ángulo del anuncio, creatividades que usarás…"
          />
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit">Crear landing</Button>
          </div>
        </form>
      </Panel>

      <div className="mt-6">
        <Panel title="Todas las landings">
          {rows?.length ? (
            <Table>
              <thead>
                <tr>
                  <th className={th}>Título</th>
                  <th className={th}>Dirección</th>
                  <th className={th}>Excursión</th>
                  <th className={th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id}>
                    <td className={td}>
                      <Link
                        href={`/admin/landings/${l.id}`}
                        className="font-medium text-primary hover:text-brand-secondary"
                      >
                        {l.title}
                      </Link>
                    </td>
                    <td className={`${td} font-mono text-xs`}>/l/{l.slug}</td>
                    <td className={td}>{l.tours?.title ?? "-"}</td>
                    <td className={td}>
                      <TourStatus status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState title="Todavía no hay landings">
              Escribe el título de tu primera campaña arriba.
            </EmptyState>
          )}
        </Panel>
      </div>
    </>
  );
}
