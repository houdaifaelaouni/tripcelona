import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/print-button";
import { ButtonLink } from "@/components/admin/button";
import { EmptyState, PageTitle, Panel, Table, td, th } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { formatDateShort } from "@/lib/tours/format";

export const metadata: Metadata = { title: "Lista de pasajeros" };

/** Who is on a departure: paid bookings with phone and pickup notes, printable. */
export default async function PassengerList({ params }: PageProps<"/admin/salidas/[id]">) {
  await requireStaff("owner");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const db = await createClient();
  const { data: departure } = await db
    .from("tour_departures")
    .select("id, starts_at, capacity, seats_taken, status, tour_id, tours(title)")
    .eq("id", id)
    .maybeSingle();
  if (!departure) notFound();
  const { data: bookings } = await db
    .from("bookings")
    .select("id, reference, status, customer_name, email, phone, travellers, pickup_note, notes")
    .eq("departure_id", id)
    .in("status", ["paid", "pending"])
    .order("customer_name");

  const paid = (bookings ?? []).filter((b) => b.status === "paid");
  const pending = (bookings ?? []).filter((b) => b.status === "pending");
  const pax = paid.reduce((n, b) => n + b.travellers, 0);

  return (
    <>
      <PageTitle
        crumbs={[
          { label: "Excursiones", href: "/admin/excursiones" },
          { label: departure.tours.title, href: `/admin/excursiones/${departure.tour_id}` },
          { label: "Pasajeros" },
        ]}
        description={`${formatDateShort(departure.starts_at)} · ${pax} pasajeros confirmados de ${departure.capacity} plazas`}
        actions={
          <div className="flex gap-2 print:hidden">
            <PrintButton />
            <ButtonLink href={`/admin/exportar/pasajeros/${id}`} variant="secondary">
              Descargar CSV
            </ButtonLink>
          </div>
        }
      >
        Pasajeros: {departure.tours.title}
      </PageTitle>
      <Panel title={`Reservas pagadas (${paid.length})`}>
        {paid.length ? (
          <Table>
            <thead>
              <tr>
                <th className={th}>Cliente</th>
                <th className={th}>Teléfono</th>
                <th className={th}>Pax</th>
                <th className={th}>Recogida y notas</th>
                <th className={th}>Ref.</th>
              </tr>
            </thead>
            <tbody>
              {paid.map((b) => (
                <tr key={b.id}>
                  <td className={td}>
                    {b.customer_name}
                    <br />
                    <span className="text-tertiary">{b.email}</span>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{b.phone ?? "-"}</td>
                  <td className={td}>{b.travellers}</td>
                  <td className={td}>
                    {[b.pickup_note, b.notes].filter(Boolean).join(" · ") || "-"}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <Link
                      href={`/admin/reservas/${b.id}`}
                      className="text-primary hover:text-brand-secondary print:no-underline"
                    >
                      {b.reference}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState illustration="tickets" title="Todavía no hay reservas pagadas">
            Cuando alguien pague esta salida aparecerá aquí.
          </EmptyState>
        )}
      </Panel>
      {pending.length > 0 && (
        <p className="mt-4 text-sm text-tertiary print:hidden">
          Hay {pending.length} {pending.length === 1 ? "reserva pendiente" : "reservas pendientes"}{" "}
          de pago ({pending.reduce((n, b) => n + b.travellers, 0)} personas) que no se incluyen.
        </p>
      )}
    </>
  );
}
