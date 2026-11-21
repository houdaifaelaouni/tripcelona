import type { Metadata } from "next";
import { Button, ButtonLink } from "@/components/admin/button";
import { Flash } from "@/components/admin/flash";
import { BookingStatus, PageTitle, Panel, StatusBadge, Table, td, th } from "@/components/admin/ui";
import { setCheckin } from "@/lib/admin/ticket-actions";
import { requireStaff } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { isReference } from "@/lib/tickets/codes";
import { formatDateLong, formatTime } from "@/lib/tours/format";

export const metadata: Metadata = { title: "Embarque" };

const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
const madridDay = (iso: string | number) =>
  new Date(iso).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" });
/** Kept outside the component so the render stays pure for the linter. */
const isToday = (iso: string) => madridDay(iso) === madridDay(Date.now());

/**
 * What staff see when they scan the e-ticket QR with the phone camera: the
 * booking, whether it is valid today, and a button per passenger to mark
 * them as boarded.
 */
export default async function Checkin({
  params,
  searchParams,
}: PageProps<"/admin/billetes/[ref]">) {
  await requireStaff("any");
  const ref = decodeURIComponent((await params).ref).toUpperCase();
  const { ok, error } = await searchParams;
  const { data: b } = isReference(ref)
    ? await createAdminClient()
        .from("bookings")
        .select(
          `id, reference, status, travellers, customer_name, phone,
           tour_departures!inner(id, starts_at, tours!inner(title, meeting_point)),
           booking_travellers(id, name, document_id, position, checked_in_at)`,
        )
        .eq("reference", ref)
        .maybeSingle()
    : { data: null };

  if (!b)
    return (
      <>
        <PageTitle description="Este código no corresponde a ninguna reserva.">
          Ticket no válido
        </PageTitle>
        <StatusBadge tone="danger">No válido</StatusBadge>
      </>
    );

  const d = b.tour_departures;
  const today = isToday(d.starts_at);
  const valid = b.status === "paid";
  const pax = [...b.booking_travellers].sort((x, y) => x.position - y.position);
  const boarded = pax.filter((p) => p.checked_in_at).length;

  return (
    <>
      <PageTitle
        crumbs={[{ href: `/admin/salidas/${d.id}`, label: "Salida" }, { label: b.reference }]}
        description={`${d.tours.title} · ${formatDateLong(d.starts_at)} · ${formatTime(d.starts_at)}`}
      >
        {b.customer_name}
      </PageTitle>
      <Flash ok={ok} error={error} />

      <div className="mb-6 flex flex-wrap gap-2">
        {valid ? (
          <StatusBadge tone="success">Ticket válido</StatusBadge>
        ) : (
          <StatusBadge tone="danger">Reserva no pagada</StatusBadge>
        )}
        {!today && <StatusBadge tone="accent">No es para hoy</StatusBadge>}
        <StatusBadge tone="brand">
          {boarded}/{b.travellers} embarcados
        </StatusBadge>
        <BookingStatus status={b.status} />
      </div>

      <Panel
        title="Pasajeros"
        actions={
          valid && (pax.length === 0 || boarded < pax.length) ? (
            <form action={setCheckin}>
              <input type="hidden" name="ref" value={b.reference} />
              <input type="hidden" name="all" value="1" />
              <Button type="submit">Embarcar a todos</Button>
            </form>
          ) : undefined
        }
      >
        {pax.length ? (
          <Table>
            <thead>
              <tr>
                <th className={th}>Pasajero</th>
                <th className={th}>Documento</th>
                <th className={th}>Embarque</th>
              </tr>
            </thead>
            <tbody>
              {pax.map((p) => (
                <tr key={p.id}>
                  <td className={`${td} font-medium`}>{p.name}</td>
                  <td className={td}>{p.document_id ?? "-"}</td>
                  <td className={td}>
                    <form action={setCheckin} className="flex items-center gap-2">
                      <input type="hidden" name="ref" value={b.reference} />
                      <input type="hidden" name="traveller" value={p.id} />
                      {p.checked_in_at ? (
                        <>
                          <span className="text-success-primary">✓ {hhmm(p.checked_in_at)}</span>
                          <Button type="submit" name="undo" value="1" variant="tertiary" size="sm">
                            Deshacer
                          </Button>
                        </>
                      ) : (
                        <Button type="submit" size="sm" disabled={!valid}>
                          Embarcar
                        </Button>
                      )}
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="px-4 pb-5 text-sm text-tertiary md:px-5">
            El cliente aún no ha escrito los nombres de los pasajeros ({b.travellers} plazas).
            Teléfono: {b.phone ?? "-"}.
          </p>
        )}
      </Panel>

      <div className="mt-6">
        <ButtonLink href={`/admin/salidas/${d.id}`} variant="secondary">
          Ver lista de la salida
        </ButtonLink>
      </div>
    </>
  );
}
