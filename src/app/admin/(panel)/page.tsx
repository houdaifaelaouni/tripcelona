import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/admin/flash";
import {
  BookingStatus,
  DepartureStatus,
  PageTitle,
  Panel,
  Table,
  td,
  th,
} from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { formatDateShort, formatPrice, formatTime } from "@/lib/tours/format";

export const metadata: Metadata = { title: "Panel" };

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const staff = await requireStaff();
  const { aviso } = await searchParams;
  const db = await createClient();

  const { data: departures } = await db
    .from("tour_departures")
    .select("id, starts_at, capacity, seats_taken, status, tours(id, title)")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(12);

  const bookings =
    staff.role === "owner"
      ? (
          await db
            .from("bookings")
            .select("id, reference, customer_name, travellers, total_cents, status, created_at")
            .order("created_at", { ascending: false })
            .limit(8)
        ).data
      : null;

  return (
    <>
      <PageTitle>Hola{staff.name ? `, ${staff.name}` : ""}</PageTitle>
      <Flash ok={aviso} />
      <Panel title="Próximas salidas">
        {departures?.length ? (
          <Table>
            <thead>
              <tr>
                <th className={th}>Fecha</th>
                <th className={th}>Excursión</th>
                <th className={th}>Plazas</th>
                <th className={th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {departures.map((d) => (
                <tr key={d.id}>
                  <td className={td}>
                    {formatDateShort(d.starts_at)} · {formatTime(d.starts_at)}
                  </td>
                  <td className={td}>
                    <Link className="text-blue underline" href={`/admin/excursiones/${d.tours.id}`}>
                      {d.tours.title}
                    </Link>
                  </td>
                  <td className={td}>
                    {d.seats_taken} / {d.capacity}
                  </td>
                  <td className={td}>
                    <DepartureStatus status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="text-muted">No hay salidas programadas.</p>
        )}
      </Panel>

      {bookings && (
        <Panel title="Últimas reservas">
          {bookings.length ? (
            <Table>
              <thead>
                <tr>
                  <th className={th}>Referencia</th>
                  <th className={th}>Cliente</th>
                  <th className={th}>Pax</th>
                  <th className={th}>Total</th>
                  <th className={th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className={td}>
                      <Link className="text-blue underline" href={`/admin/reservas/${b.id}`}>
                        {b.reference}
                      </Link>
                    </td>
                    <td className={td}>{b.customer_name}</td>
                    <td className={td}>{b.travellers}</td>
                    <td className={td}>{formatPrice(b.total_cents)}</td>
                    <td className={td}>
                      <BookingStatus status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted">Todavía no hay reservas.</p>
          )}
        </Panel>
      )}
    </>
  );
}
