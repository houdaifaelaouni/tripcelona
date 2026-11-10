import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/admin/flash";
import { BookingStatus, PageTitle, Panel, Table, td, th } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import {
  cancelPendingBooking,
  refundBookingAction,
  resendBookingEmail,
} from "@/lib/admin/booking-actions";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { formatDateLong, formatPrice, formatTime } from "@/lib/tours/format";

export const metadata: Metadata = { title: "Reserva" };

const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(iso));
const EMAIL_LABELS: Record<string, string> = {
  confirmation: "Confirmación",
  owner_alert: "Aviso al propietario",
  payment_failed: "Pago fallido",
  payment_request: "Enlace de pago",
  cancellation: "Cancelación",
};

export default async function BookingDetail({
  params,
  searchParams,
}: PageProps<"/admin/reservas/[id]">) {
  await requireStaff("owner");
  const { id } = await params;
  const { ok, error } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const db = await createClient();
  const { data: b } = await db
    .from("bookings")
    .select("*, tour_departures(id, starts_at, ends_at, tours(id, title))")
    .eq("id", id)
    .maybeSingle();
  if (!b) notFound();
  const [{ data: payments }, { data: emails }, { data: log }] = await Promise.all([
    db
      .from("payments")
      .select("id, provider, provider_ref, amount_cents, status, created_at, refunded_at")
      .eq("booking_id", id)
      .order("created_at"),
    db
      .from("booking_emails")
      .select("kind, status, attempts, updated_at, error")
      .eq("booking_id", id)
      .order("created_at"),
    db
      .from("audit_log")
      .select("id, action, created_at")
      .eq("entity", "bookings")
      .eq("entity_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const dep = b.tour_departures;

  return (
    <>
      <PageTitle actions={<BookingStatus status={b.status} />}>Reserva {b.reference}</PageTitle>
      <Flash ok={ok} error={error} />
      <div className="grid gap-x-6 lg:grid-cols-2">
        <Panel title="Cliente">
          <dl className="grid grid-cols-[120px_1fr] gap-y-1 text-sm">
            <dt className="text-muted">Nombre</dt>
            <dd>{b.customer_name}</dd>
            <dt className="text-muted">Email</dt>
            <dd>
              <a className="text-blue underline" href={`mailto:${b.email}`}>
                {b.email}
              </a>
            </dd>
            <dt className="text-muted">Teléfono</dt>
            <dd>{b.phone ?? "—"}</dd>
            <dt className="text-muted">Comentarios</dt>
            <dd className="whitespace-pre-line">{b.pickup_note || "—"}</dd>
            {b.notes && (
              <>
                <dt className="text-muted">Notas</dt>
                <dd>{b.notes}</dd>
              </>
            )}
          </dl>
        </Panel>
        <Panel title="Excursión">
          <dl className="grid grid-cols-[120px_1fr] gap-y-1 text-sm">
            <dt className="text-muted">Excursión</dt>
            <dd>
              <Link className="text-blue underline" href={`/admin/excursiones/${dep.tours.id}`}>
                {dep.tours.title}
              </Link>
            </dd>
            <dt className="text-muted">Fecha</dt>
            <dd className="first-letter:uppercase">
              {formatDateLong(dep.starts_at)} · {formatTime(dep.starts_at)}
            </dd>
            <dt className="text-muted">Viajeros</dt>
            <dd>{b.travellers}</dd>
            <dt className="text-muted">Total</dt>
            <dd className="font-bold">{formatPrice(b.total_cents)}</dd>
            <dt className="text-muted">Creada</dt>
            <dd>{dateTime(b.created_at)}</dd>
          </dl>
        </Panel>
      </div>

      <Panel title="Pagos">
        {payments?.length ? (
          <Table>
            <thead>
              <tr>
                <th className={th}>Fecha</th>
                <th className={th}>Método</th>
                <th className={th}>Referencia</th>
                <th className={th}>Importe</th>
                <th className={th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className={td}>{dateTime(p.created_at)}</td>
                  <td className={td}>{p.provider === "redsys" ? "Tarjeta (Redsys)" : "Manual"}</td>
                  <td className={td}>{p.provider_ref}</td>
                  <td className={td}>{formatPrice(p.amount_cents)}</td>
                  <td className={td}>
                    {
                      {
                        pending: "Iniciado",
                        succeeded: "Cobrado",
                        failed: "Fallido",
                        refunded: "Reembolsado",
                      }[p.status]
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="text-sm text-muted">Sin intentos de pago.</p>
        )}
      </Panel>

      <div className="grid gap-x-6 lg:grid-cols-2">
        <Panel title="Emails">
          <ul className="mb-3 text-sm">
            {(emails ?? []).map((e) => (
              <li key={e.kind}>
                {EMAIL_LABELS[e.kind]}:{" "}
                {e.status === "sent" ? "enviado" : e.status === "failed" ? "falló" : "enviando"}
                {e.attempts > 1 && ` (${e.attempts} envíos)`} · {dateTime(e.updated_at)}
              </li>
            ))}
            {!emails?.length && <li className="text-muted">Ningún email enviado.</li>}
          </ul>
          <form
            action={resendBookingEmail.bind(null, b.id)}
            className="flex flex-wrap items-end gap-2"
          >
            <Select
              label="Reenviar"
              name="kind"
              defaultValue={b.status === "paid" ? "confirmation" : "payment_request"}
            >
              <option value="confirmation">Confirmación al cliente</option>
              <option value="owner_alert">Aviso al propietario</option>
              <option value="payment_request">Enlace de pago (reserva pendiente)</option>
              <option value="payment_failed">Aviso de pago fallido</option>
              <option value="cancellation">Cancelación al cliente</option>
            </Select>
            <Button type="submit" variant="secondary" className="h-10">
              Reenviar
            </Button>
          </form>
        </Panel>
        <Panel title="Acciones">
          {b.status === "paid" && (
            <form
              action={refundBookingAction.bind(null, b.id)}
              className="flex flex-col gap-2 text-sm"
            >
              <label className="flex items-start gap-2">
                <input type="checkbox" name="confirm" required className="mt-1" />
                <span>
                  Reembolsar {formatPrice(b.total_cents)}, liberar las plazas y avisar al cliente.
                  No se puede deshacer.
                </span>
              </label>
              <Button type="submit" variant="outline" className="self-start text-danger">
                Reembolsar reserva
              </Button>
            </form>
          )}
          {b.status === "pending" && (
            <form action={cancelPendingBooking.bind(null, b.id)}>
              <p className="mb-2 text-sm">Pendiente de pago. Cancelarla libera sus plazas.</p>
              <Button type="submit" variant="outline">
                Cancelar reserva pendiente
              </Button>
            </form>
          )}
          {(b.status === "cancelled" || b.status === "refunded") && (
            <p className="text-sm text-muted">Reserva cerrada: no hay acciones disponibles.</p>
          )}
        </Panel>
      </div>

      {log && log.length > 0 && (
        <Panel title="Historial">
          <ul className="text-sm text-muted">
            {log.map((l) => (
              <li key={l.id}>
                {dateTime(l.created_at)} · {l.action}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
