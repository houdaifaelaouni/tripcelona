import type { Metadata } from "next";
import Link from "next/link";
import {
  BookingStatus,
  EmptyState,
  PageTitle,
  Panel,
  ResultCount,
  Table,
  td,
  th,
} from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/admin/button";
import { Input, Select } from "@/components/admin/fields";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { formatDateShort, formatPrice } from "@/lib/tours/format";

export const metadata: Metadata = { title: "Reservas" };

const STATUSES = ["pending", "paid", "cancelled", "refunded"] as const;
type Status = (typeof STATUSES)[number];
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function BookingsAdmin({ searchParams }: PageProps<"/admin/reservas">) {
  await requireStaff("owner");
  const params = await searchParams;
  const status = one(params.estado) as Status | "";
  const q = one(params.q).trim();

  const db = await createClient();
  let query = db
    .from("bookings")
    .select(
      "id, reference, customer_name, email, travellers, total_cents, status, created_at, tour_departures(starts_at, tours(title))",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (STATUSES.includes(status as Status)) query = query.eq("status", status as Status);
  if (q) {
    const safe = q.replace(/[%,()]/g, "");
    query = query.or(
      `reference.ilike.%${safe}%,email.ilike.%${safe}%,customer_name.ilike.%${safe}%`,
    );
  }
  const { data: bookings } = await query;

  return (
    <>
      <PageTitle
        actions={
          <div className="flex gap-2">
            <ButtonLink
              href={`/admin/exportar/reservas${status ? `?estado=${status}` : ""}`}
              variant="secondary"
            >
              Descargar CSV
            </ButtonLink>
            <ButtonLink href="/admin/reservas/nueva">Nueva reserva manual</ButtonLink>
          </div>
        }
        description="Busca por referencia, email o nombre del cliente."
      >
        Reservas
      </PageTitle>
      <Panel
        title="Todas las reservas"
        footer={
          <ResultCount
            count={bookings?.length ?? 0}
            one="reserva"
            many={bookings?.length === 100 ? "reservas (las 100 más recientes)" : "reservas"}
          />
        }
      >
        <form
          className="-mx-5 -mt-5 grid grid-cols-1 items-end gap-3 border-b border-secondary bg-primary px-5 py-4 sm:grid-cols-[1fr_200px_auto]"
          role="search"
        >
          <Input
            label="Buscar"
            name="q"
            defaultValue={q}
            placeholder="Referencia, email o nombre"
          />
          <Select label="Estado" name="estado" defaultValue={status}>
            <option value="">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="paid">Pagada</option>
            <option value="cancelled">Cancelada</option>
            <option value="refunded">Reembolsada</option>
          </Select>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>
        {bookings?.length ? (
          <Table>
            <thead>
              <tr>
                <th className={th}>Referencia</th>
                <th className={th}>Cliente</th>
                <th className={th}>Excursión</th>
                <th className={th}>Fecha</th>
                <th className={th}>Pax</th>
                <th className={th}>Total</th>
                <th className={th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className={`${td} whitespace-nowrap`}>
                    <Link
                      className="font-medium text-primary hover:text-brand-secondary"
                      href={`/admin/reservas/${b.id}`}
                    >
                      {b.reference}
                    </Link>
                  </td>
                  <td className={td}>
                    {b.customer_name}
                    <br />
                    <span className="text-tertiary">{b.email}</span>
                  </td>
                  <td className={td}>{b.tour_departures.tours.title}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    {formatDateShort(b.tour_departures.starts_at)}
                  </td>
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
          <EmptyState illustration="tickets" title="No hay reservas con estos filtros">
            Prueba con otro estado o borra la búsqueda.
          </EmptyState>
        )}
      </Panel>
    </>
  );
}
