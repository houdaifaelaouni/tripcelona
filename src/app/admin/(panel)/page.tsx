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
import { assessHealth, loadHealthInput, type HealthReport } from "@/lib/ops/health";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const inbox =
    staff.role === "owner"
      ? await Promise.all([
          db.from("tour_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
          db
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("source", "contact")
            .eq("status", "new"),
        ]).then(([q, m]) => ({ quotes: q.count ?? 0, messages: m.count ?? 0 }))
      : null;

  // Owner only: the report reads payments and emails with the service role.
  const health =
    staff.role === "owner"
      ? await loadHealthInput(createAdminClient(), 24)
          .then(assessHealth)
          .catch(() => null)
      : undefined;

  return (
    <>
      <PageTitle>Hola{staff.name ? `, ${staff.name}` : ""}</PageTitle>
      <Flash ok={aviso} />
      {inbox && (inbox.quotes > 0 || inbox.messages > 0) && (
        <Panel>
          <p>
            Tienes{" "}
            <Link className="font-bold text-blue underline" href="/admin/solicitudes?estado=new">
              {inbox.quotes}{" "}
              {inbox.quotes === 1
                ? "solicitud de presupuesto nueva"
                : "solicitudes de presupuesto nuevas"}
            </Link>{" "}
            y{" "}
            <Link
              className="font-bold text-blue underline"
              href="/admin/solicitudes?tipo=mensajes&estado=new"
            >
              {inbox.messages} {inbox.messages === 1 ? "mensaje nuevo" : "mensajes nuevos"}
            </Link>
            .
          </p>
        </Panel>
      )}
      {health !== undefined && <HealthPanel report={health} />}
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

const STATUS_TEXT: Record<HealthReport["status"], { label: string; className: string }> = {
  ok: { label: "Todo en orden", className: "bg-success text-white" },
  warning: { label: "Revisa los avisos", className: "bg-yellow text-ink" },
  critical: { label: "Hay un problema importante", className: "bg-danger text-white" },
};

/** Last 24 h at a glance (US-41). Same checks as `pnpm ops health`. */
function HealthPanel({ report }: { report: HealthReport | null }) {
  if (!report) {
    return (
      <Panel title="Estado de la web (24 h)">
        <p className="text-danger">
          No se pudo calcular el estado. Revisa los registros de Vercel.
        </p>
      </Panel>
    );
  }
  const s = STATUS_TEXT[report.status];
  const { started, paid, abandoned, conversion } = report.funnel;
  return (
    <Panel title="Estado de la web (24 h)">
      <p
        className={`inline-block rounded-control px-3 py-1 font-bold ${s.className}`}
        role="status"
      >
        {s.label}
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
        {[
          ["Reservas iniciadas", started],
          ["Pagadas", paid],
          ["Conversión", conversion === null ? "–" : `${Math.round(conversion * 100)} %`],
          ["Abandonadas", abandoned],
          ["Emails enviados", report.emailsSent],
        ].map(([label, value]) => (
          <div key={label as string}>
            <dt className="text-muted">{label}</dt>
            <dd className="text-lg font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      {report.alerts.length > 0 && (
        <ul className="mt-4 space-y-3">
          {report.alerts.map((a) => (
            <li key={a.title} className="rounded-card border border-border p-3">
              <p className="font-bold">
                <span className="mr-2 rounded-control bg-surface-alt px-2 py-0.5 text-sm">
                  {a.severity}
                </span>
                {a.title}
              </p>
              <p className="mt-1 text-sm">{a.detail}</p>
              {a.refs.length > 0 && <p className="mt-1 text-sm text-muted">{a.refs.join(", ")}</p>}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
