import type { Metadata } from "next";
import { Button, ButtonLink } from "@/components/admin/button";
import { Flash } from "@/components/admin/flash";
import { BookingStatus, PageTitle, Panel, StatusBadge } from "@/components/admin/ui";
import { setCheckin } from "@/lib/admin/ticket-actions";
import { requireStaff } from "@/lib/auth/staff";
import { prettyCode } from "@/lib/tickets/codes";
import { getTicketByCode } from "@/lib/tickets/queries";
import { formatDateLong, formatTime } from "@/lib/tours/format";

export const metadata: Metadata = { title: "Billete" };

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });

/**
 * What staff see when they scan a ticket's QR with the phone camera: who it
 * is, which trip, whether it is valid today, and a big "Embarcado" button.
 */
export default async function TicketCheckin({
  params,
  searchParams,
}: PageProps<"/admin/billetes/[code]">) {
  await requireStaff("any");
  const { code } = await params;
  const { ok, error } = await searchParams;
  const ticket = await getTicketByCode(code.toUpperCase());

  if (!ticket)
    return (
      <>
        <PageTitle description="Este código no corresponde a ningún billete.">
          Billete no válido
        </PageTitle>
        <StatusBadge tone="danger">No válido</StatusBadge>
      </>
    );

  const b = ticket.bookings;
  const d = b.tour_departures;
  const today =
    new Date(d.starts_at).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" }) ===
    new Date().toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" });
  const valid = b.status === "paid";

  return (
    <>
      <PageTitle
        crumbs={[
          { href: `/admin/salidas/${d.id}`, label: "Salida" },
          { label: prettyCode(ticket.ticket_code!) },
        ]}
        description={`${d.tours.title} · ${formatDateLong(d.starts_at)} · ${formatTime(d.starts_at)}`}
      >
        {ticket.name}
      </PageTitle>
      <Flash ok={ok} error={error} />

      <div className="mb-6 flex flex-wrap gap-2">
        {valid ? (
          <StatusBadge tone="success">Billete válido</StatusBadge>
        ) : (
          <StatusBadge tone="danger">Reserva no pagada</StatusBadge>
        )}
        {!today && <StatusBadge tone="accent">No es para hoy</StatusBadge>}
        {ticket.checked_in_at && (
          <StatusBadge tone="brand">Embarcado a las {time(ticket.checked_in_at)}</StatusBadge>
        )}
      </div>

      <Panel title="Viajero">
        <dl className="grid gap-4 px-4 pb-5 text-sm md:grid-cols-3 md:px-5">
          <div>
            <dt className="text-tertiary">Documento</dt>
            <dd className="font-medium text-primary">{ticket.document_id ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-tertiary">Teléfono</dt>
            <dd className="font-medium text-primary">{ticket.phone ?? b.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-tertiary">Reserva</dt>
            <dd className="flex items-center gap-2 font-medium text-primary">
              {b.reference} <BookingStatus status={b.status} />
            </dd>
          </div>
          <div>
            <dt className="text-tertiary">Viajero</dt>
            <dd className="font-medium text-primary">
              {ticket.position} de {b.travellers} · titular {b.customer_name}
            </dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-tertiary">Punto de encuentro</dt>
            <dd className="font-medium text-primary">{d.tours.meeting_point ?? "—"}</dd>
          </div>
        </dl>
      </Panel>

      <form action={setCheckin} className="mt-6 flex flex-wrap gap-3">
        <input type="hidden" name="code" value={ticket.ticket_code!} />
        {ticket.checked_in_at ? (
          <Button type="submit" name="undo" value="1" variant="secondary">
            Deshacer embarque
          </Button>
        ) : (
          <Button type="submit" size="lg" disabled={!valid}>
            Marcar como embarcado
          </Button>
        )}
        <ButtonLink href={`/admin/salidas/${d.id}`} variant="secondary">
          Ver lista de la salida
        </ButtonLink>
      </form>
    </>
  );
}
