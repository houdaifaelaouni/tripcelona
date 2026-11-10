import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle, Panel, Table, TourStatus, td, th } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { formatDateShort, formatPrice } from "@/lib/tours/format";

export const metadata: Metadata = { title: "Excursiones" };

export default async function ToursAdmin() {
  await requireStaff();
  const db = await createClient();
  const now = new Date().toISOString();
  const { data: tours } = await db
    .from("tours")
    .select("id, title, area, status, price_from_cents, tour_departures(starts_at, status)")
    .order("title");

  return (
    <>
      <PageTitle>Excursiones</PageTitle>
      <Panel>
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
                      className="font-bold text-blue underline"
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
                      <span className="text-danger">Sin fechas</span>
                    )}
                  </td>
                  <td className={td}>
                    <TourStatus status={t.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
