import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/admin/flash";
import { CalendarDays, Euro, Inbox, Users } from "lucide-react";
import {
  BookingStatus,
  DepartureStatus,
  EmptyState,
  PageTitle,
  Panel,
  StatCard,
  StatGrid,
  StatusBadge,
  Table,
  td,
  th,
} from "@/components/admin/ui";
import { OccupancyChart, SalesChart } from "@/components/admin/dashboard-charts";
import { Alert } from "@/components/admin/alert";
import { ButtonLink } from "@/components/admin/button";
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

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 864e5).toISOString();
  const ago30 = new Date(now.getTime() - 30 * 864e5).toISOString();
  const ago60 = new Date(now.getTime() - 60 * 864e5).toISOString();
  const [{ data: soon }, { count: publishedTours }] = await Promise.all([
    db
      .from("tour_departures")
      .select("capacity, seats_taken")
      .neq("status", "cancelled")
      .gte("starts_at", now.toISOString())
      .lte("starts_at", in30),
    db.from("tours").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);
  const seats = (soon ?? []).reduce(
    (acc, d) => ({ taken: acc.taken + d.seats_taken, total: acc.total + d.capacity }),
    { taken: 0, total: 0 },
  );
  const sales =
    staff.role === "owner"
      ? (
          await db
            .from("bookings")
            .select("total_cents, created_at")
            .eq("status", "paid")
            .gte("created_at", ago60)
        ).data
      : null;
  const salesNow = sales?.filter((b) => b.created_at >= ago30) ?? null;
  const salesPrev = sales?.filter((b) => b.created_at < ago30) ?? [];
  const sum = (rows: { total_cents: number }[]) => rows.reduce((a, b) => a + b.total_cents, 0);
  const salesTrend =
    salesNow && sum(salesPrev) > 0
      ? Math.round(((sum(salesNow) - sum(salesPrev)) / sum(salesPrev)) * 100)
      : null;
  const madridDay = (iso: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date(iso));
  const salesByDay = salesNow
    ? Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now.getTime() - (29 - i) * 864e5).toISOString();
        const key = madridDay(date);
        const rows = salesNow.filter((b) => madridDay(b.created_at) === key);
        return { date, cents: sum(rows), bookings: rows.length };
      })
    : null;

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

  const occupancy = seats.total ? Math.round((seats.taken / seats.total) * 100) : null;
  return (
    <>
      <PageTitle
        description={
          <>
            <span className="first-letter:uppercase">
              {new Intl.DateTimeFormat("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: "Europe/Madrid",
              }).format(now)}
            </span>
            {" · "}Resumen de las próximas salidas, las ventas y lo que tienes pendiente.
          </>
        }
        actions={
          <>
            <ButtonLink href="/admin/excursiones" variant="secondary">
              Ver excursiones
            </ButtonLink>
            {staff.role === "owner" && (
              <ButtonLink href="/admin/reservas/nueva">Nueva reserva manual</ButtonLink>
            )}
          </>
        }
      >
        Hola{staff.name ? `, ${staff.name}` : ""}
      </PageTitle>
      <Flash ok={aviso} />
      <StatGrid>
        <StatCard
          icon={CalendarDays}
          label="Salidas en 30 días"
          value={soon?.length ?? 0}
          hint={`${publishedTours ?? 0} excursiones publicadas`}
          href="/admin/excursiones"
        />
        <StatCard
          icon={Users}
          label="Plazas vendidas (30 días)"
          value={`${seats.taken} / ${seats.total}`}
          hint={occupancy === null ? "Sin salidas próximas" : `${occupancy} % de ocupación`}
        />
        {salesNow && (
          <StatCard
            icon={Euro}
            label="Ventas (últimos 30 días)"
            value={formatPrice(sum(salesNow ?? []))}
            hint={`${salesNow?.length ?? 0} ${salesNow?.length === 1 ? "reserva pagada" : "reservas pagadas"}`}
            trend={
              salesTrend === null
                ? undefined
                : { value: `${Math.abs(salesTrend)} %`, up: salesTrend >= 0 }
            }
            href="/admin/reservas?estado=paid"
          />
        )}
        {inbox && (
          <StatCard
            icon={Inbox}
            label="Pendiente de responder"
            value={inbox.quotes + inbox.messages}
            hint={`${inbox.quotes} presupuestos · ${inbox.messages} mensajes`}
            href="/admin/solicitudes?estado=new"
          />
        )}
      </StatGrid>
      <div className="grid gap-x-6 xl:grid-cols-2">
        {salesByDay && (
          <Panel title="Ventas" description="Reservas pagadas por día, últimos 30 días.">
            <SalesChart data={salesByDay} />
          </Panel>
        )}
        <Panel title="Ocupación" description="Plazas vendidas y libres en las próximas salidas.">
          {departures?.length ? (
            <OccupancyChart
              data={departures
                .filter((d) => d.status !== "cancelled")
                .slice(0, 8)
                .map((d) => ({
                  label: formatDateShort(d.starts_at).replace(/^\w+,\s*/, ""),
                  taken: d.seats_taken,
                  free: Math.max(d.capacity - d.seats_taken, 0),
                }))}
            />
          ) : (
            <EmptyState illustration="calendar" title="Sin salidas programadas">
              Añade fechas desde la ficha de cada excursión.
            </EmptyState>
          )}
        </Panel>
      </div>
      {health !== undefined && <HealthPanel report={health} />}
      <div className="grid gap-x-6 xl:grid-cols-2">
        <Panel
          title="Próximas salidas"
          actions={
            <ButtonLink href="/admin/excursiones" variant="outline" size="sm">
              Ver excursiones
            </ButtonLink>
          }
        >
          {departures?.length ? (
            <Table className="min-w-[480px]">
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
                    <td className={`${td} whitespace-nowrap`}>
                      {formatDateShort(d.starts_at)} · {formatTime(d.starts_at)}
                    </td>
                    <td className={td}>
                      <Link
                        className="font-medium text-primary hover:text-brand-secondary"
                        href={`/admin/excursiones/${d.tours.id}`}
                      >
                        {d.tours.title}
                      </Link>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
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
            <EmptyState illustration="calendar" title="Sin salidas programadas">
              Añade fechas desde la ficha de cada excursión para abrir la venta.
            </EmptyState>
          )}
        </Panel>

        {bookings && (
          <Panel
            title="Últimas reservas"
            actions={
              <ButtonLink href="/admin/reservas" variant="outline" size="sm">
                Ver todas
              </ButtonLink>
            }
          >
            {bookings.length ? (
              <Table className="min-w-[480px]">
                <thead>
                  <tr>
                    <th className={th}>Referencia</th>
                    <th className={th}>Cliente</th>
                    <th className={th}>Total</th>
                    <th className={th}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td className={td}>
                        <Link
                          className="font-medium text-primary hover:text-brand-secondary"
                          href={`/admin/reservas/${b.id}`}
                        >
                          {b.reference}
                        </Link>
                      </td>
                      <td className={td}>
                        {b.customer_name}
                        <span className="block text-xs text-tertiary">
                          {b.travellers} {b.travellers === 1 ? "viajero" : "viajeros"}
                        </span>
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{formatPrice(b.total_cents)}</td>
                      <td className={td}>
                        <BookingStatus status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyState illustration="tickets" title="Todavía no hay reservas">
                Las reservas pagadas aparecerán aquí en cuanto entren.
              </EmptyState>
            )}
          </Panel>
        )}
      </div>
    </>
  );
}

const STATUS_TEXT: Record<
  HealthReport["status"],
  { label: string; tone: "success" | "accent" | "danger" }
> = {
  ok: { label: "Todo en orden", tone: "success" },
  warning: { label: "Revisa los avisos", tone: "accent" },
  critical: { label: "Hay un problema importante", tone: "danger" },
};

/** Last 24 h at a glance (US-41). Same checks as `pnpm ops health`. */
function HealthPanel({ report }: { report: HealthReport | null }) {
  if (!report) {
    return (
      <Panel title="Estado de la web (24 h)">
        <Alert tone="error" title="No se pudo calcular el estado">
          Revisa los registros de Vercel.
        </Alert>
      </Panel>
    );
  }
  const s = STATUS_TEXT[report.status];
  const { started, paid, abandoned, conversion } = report.funnel;
  return (
    <Panel
      title="Estado de la web (24 h)"
      actions={
        <span role="status">
          <StatusBadge tone={s.tone}>{s.label}</StatusBadge>
        </span>
      }
    >
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          ["Reservas iniciadas", started],
          ["Pagadas", paid],
          ["Conversión", conversion === null ? "–" : `${Math.round(conversion * 100)} %`],
          ["Abandonadas", abandoned],
          ["Emails enviados", report.emailsSent],
        ].map(([label, value]) => (
          <div key={label as string}>
            <dt className="text-sm font-medium text-tertiary">{label}</dt>
            <dd className="mt-1 text-2xl leading-8 font-semibold text-primary">{value}</dd>
          </div>
        ))}
      </dl>
      {report.alerts.length > 0 && (
        <ul className="mt-5 space-y-3">
          {report.alerts.map((a) => (
            <li key={a.title}>
              <Alert
                tone={a.severity === "P0" ? "error" : "warning"}
                title={`${a.severity} · ${a.title}`}
              >
                {a.detail}
                {a.refs.length > 0 && <span className="mt-1 block">{a.refs.join(", ")}</span>}
              </Alert>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
