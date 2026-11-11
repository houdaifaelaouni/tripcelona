import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/admin/button";
import { Flash } from "@/components/admin/flash";
import {
  EmptyState,
  PageTitle,
  Panel,
  ResultCount,
  Table,
  TourStatus,
  td,
  th,
} from "@/components/admin/ui";
import { createTour } from "@/lib/admin/tour-actions";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { formatDateShort, formatPrice } from "@/lib/tours/format";

export const metadata: Metadata = { title: "Excursiones" };

export default async function ToursAdmin({ searchParams }: PageProps<"/admin/excursiones">) {
  await requireStaff();
  const { error } = await searchParams;
  const db = await createClient();
  const now = new Date().toISOString();
  const { data: tours } = await db
    .from("tours")
    .select("id, title, area, status, price_from_cents, tour_departures(starts_at, status)")
    .order("title");

  return (
    <>
      <PageTitle
        description="Fichas, fechas y plazas de cada excursión."
        actions={
          <form action={createTour}>
            <Button type="submit">Nueva excursión</Button>
          </form>
        }
      >
        Excursiones
      </PageTitle>
      <Flash error={error} />
      <Panel
        title="Catálogo"
        footer={<ResultCount count={tours?.length ?? 0} one="excursión" many="excursiones" />}
      >
        <Table>
          <thead>
            <tr>
              <th className={th}>Excursión</th>
              <th className={th}>Zona</th>
              <th className={th}>Desde</th>
              <th className={th}>Próxima salida</th>
              <th className={th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {(tours ?? []).map((t) => {
              const next = t.tour_departures
                .filter((d) => d.starts_at > now && d.status !== "cancelled")
                .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
              return (
                <tr key={t.id}>
                  <td className={td}>
                    <Link
                      className="font-semibold text-brand-secondary hover:underline"
                      href={`/admin/excursiones/${t.id}`}
                    >
                      {t.title}
                    </Link>
                  </td>
                  <td className={td}>{t.area ?? "—"}</td>
                  <td className={td}>
                    {t.price_from_cents ? formatPrice(t.price_from_cents) : "—"}
                  </td>
                  <td className={td}>
                    {next ? (
                      formatDateShort(next.starts_at)
                    ) : (
                      <span className="text-error-primary">Sin fechas</span>
                    )}
                  </td>
                  <td className={td}>
                    <TourStatus status={t.status} />
                  </td>
                </tr>
              );
            })}
            {(tours ?? []).length === 0 && (
              <tr>
                <td className={td} colSpan={5}>
                  <EmptyState illustration="route" title="Todavía no hay excursiones">
                    Crea la primera con «Nueva excursión».
                  </EmptyState>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
