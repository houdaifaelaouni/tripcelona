import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/print-button";
import { ButtonLink } from "@/components/admin/button";
import { EmptyState, PageTitle, Panel, Table, td, th } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { CopyButton } from "@/components/admin/copy-button";
import { TicketRefLink, WhatsappTicketLink } from "@/components/admin/ticket-links";
import { driverUrl } from "@/lib/tickets/driver";
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
    .select(
      "id, reference, status, customer_name, email, phone, travellers, pickup_note, notes, booking_travellers(name, document_id, position, checked_in_at)",
    )
    .eq("departure_id", id)
    .in("status", ["paid", "pending"])
    .order("customer_name");

  const paid = (bookings ?? []).filter((b) => b.status === "paid");
  const pending = (bookings ?? []).filter((b) => b.status === "pending");
  const pax = paid.reduce((n, b) => n + b.travellers, 0);
  const boarded = paid.reduce(
    (n, b) =>
      n + Math.min(b.travellers, b.booking_travellers.filter((t) => t.checked_in_at).length),
    0,
  );
  const driver = driverUrl(id);

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
      <Panel
        title="Embarque"
        description="Envía este enlace al conductor: abre la cámara del móvil, escanea el QR de cada ticket y marca a los pasajeros a bordo. No necesita cuenta."
      >
        <div className="px-4 pb-5 md:px-5">
          <dl className="grid grid-cols-3 gap-3 text-center sm:max-w-md">
            <div className="rounded-xl bg-secondary p-3">
              <dt className="text-xs text-tertiary">Tickets vendidos</dt>
              <dd className="text-2xl font-semibold">{pax}</dd>
            </div>
            <div className="rounded-xl bg-secondary p-3">
              <dt className="text-xs text-tertiary">A bordo</dt>
              <dd className="text-2xl font-semibold text-success-primary">{boarded}</dd>
            </div>
            <div className="rounded-xl bg-secondary p-3">
              <dt className="text-xs text-tertiary">Faltan</dt>
              <dd className="text-2xl font-semibold">{pax - boarded}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
            <code className="max-w-full truncate rounded-lg bg-secondary px-3 py-2 text-xs">
              {driver}
            </code>
            <CopyButton value={driver} label="Copiar enlace" />
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Enlace de embarque ${departure.tours.title} (${formatDateShort(departure.starts_at)}): ${driver}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-secondary ring-1 ring-primary ring-inset hover:bg-primary_hover"
            >
              Enviar por WhatsApp
            </a>
            <a
              href={driver}
              target="_blank"
              rel="noopener"
              className="rounded-lg bg-brand-solid px-3 py-2 text-sm font-semibold text-white hover:bg-brand-solid_hover"
            >
              Abrir escáner
            </a>
          </div>
        </div>
      </Panel>
      <Panel title={`Reservas pagadas (${paid.length})`}>
        {paid.length ? (
          <Table>
            <thead>
              <tr>
                <th className={th}>Cliente</th>
                <th className={th}>Teléfono</th>
                <th className={th}>Pasajeros</th>
                <th className={th}>Recogida y notas</th>
                <th className={th}>Ref.</th>
              </tr>
            </thead>
            <tbody>
              {paid.map((b) => (
                <tr key={b.id}>
                  <td className={td}>
                    <Link
                      href={`/admin/reservas/${b.id}`}
                      className="font-medium text-primary hover:text-brand-secondary hover:underline print:no-underline"
                    >
                      {b.customer_name}
                    </Link>
                    <br />
                    <span className="text-tertiary">{b.email}</span>
                  </td>
                  <td className={td}>
                    <span className="print:hidden">
                      <WhatsappTicketLink
                        phone={b.phone}
                        booking={{
                          id: b.id,
                          reference: b.reference,
                          customerName: b.customer_name,
                          title: departure.tours.title,
                          startsAt: departure.starts_at,
                        }}
                      />
                    </span>
                    <span className="hidden print:inline">{b.phone ?? "-"}</span>
                  </td>
                  <td className={td}>
                    {b.travellers}
                    {b.booking_travellers.length > 0 ? (
                      <ol className="mt-1 list-decimal pl-4 text-tertiary">
                        {[...b.booking_travellers]
                          .sort((x, y) => x.position - y.position)
                          .map((p) => (
                            <li key={p.position} className="whitespace-nowrap">
                              {p.name}
                              {p.document_id ? ` · ${p.document_id}` : ""}
                              {p.checked_in_at && (
                                <span className="text-success-primary"> · ✓ embarcado</span>
                              )}
                            </li>
                          ))}
                      </ol>
                    ) : (
                      <p className="mt-1 text-xs text-warning-primary print:hidden">
                        Sin nombres todavía
                      </p>
                    )}
                  </td>
                  <td className={td}>
                    {[b.pickup_note, b.notes].filter(Boolean).join(" · ") || "-"}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <TicketRefLink id={b.id} reference={b.reference} />
                    <Link
                      href={`/admin/billetes/${b.reference}`}
                      className="ml-2 text-xs text-brand-secondary hover:underline print:hidden"
                    >
                      Embarque
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
