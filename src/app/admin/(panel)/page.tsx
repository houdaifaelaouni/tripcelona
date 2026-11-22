import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/admin/flash";
import { CalendarDays, Euro, Inbox, Users } from "lucide-react";
import {
  BookingStatus,
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
import { DeparturesCalendar, type CalendarDeparture } from "@/components/admin/departures-calendar";
import { TourPerformance, type TourPerf } from "@/components/admin/tour-performance";
import { requireStaff } from "@/lib/auth/staff";
import { assessHealth, loadHealthInput, type HealthReport } from "@/lib/ops/health";
import { pendingMigrations } from "@/lib/ops/schema-check";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatDateShort, formatPrice } from "@/lib/tours/format";

export const metadata: Metadata = { title: "Panel" };

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const staff = await requireStaff();
  const { aviso, mes } = await searchParams;
  const db = await createClient();
  const calendar = await loadCalendar(db, typeof mes === "string" ? mes : undefined);
  const performance = staff.role === "owner" ? await loadPerformance(db) : null;

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

  // Owner only: SQL files the code expects but nobody has run in Supabase yet.
  const pendingSql =
    staff.role === "owner" ? await pendingMigrations(createAdminClient()).catch(() => []) : [];

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
      {pendingSql.length > 0 && (
        <Alert tone="error" title="Falta ejecutar SQL en Supabase" className="mb-6">
          La web ya usa estos cambios de base de datos, pero aún no están en Supabase. Ábrelos en la
          carpeta <code>supabase/migrations</code> del repositorio y ejecútalos, en este orden, en
          Supabase → SQL Editor:
          <ul className="mt-2 list-disc pl-5">
            {pendingSql.map((m) => (
              <li key={m.file}>
                <code>{m.file}</code> ({m.what})
              </li>
            ))}
          </ul>
        </Alert>
      )}
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
      <DeparturesCalendar
        departures={calendar.departures}
        year={calendar.year}
        month={calendar.month}
        canSeePassengers={staff.role === "owner"}
      />
      {performance && performance.length > 0 && <TourPerformance tours={performance} days={30} />}
      <div>
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

type Db = Awaited<ReturnType<typeof createClient>>;
const TZ_DAY = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date(iso));

/** Departures of one month (`?mes=YYYY-MM`, default: this month in Madrid). */
async function loadCalendar(db: Db, mes?: string) {
  const [cy, cm] = TZ_DAY(new Date().toISOString()).split("-").map(Number);
  const m = /^(\d{4})-(\d{2})$/.exec(mes ?? "");
  const year = m ? Number(m[1]) : cy;
  const month = m && Number(m[2]) >= 1 && Number(m[2]) <= 12 ? Number(m[2]) : cm;
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  // One day of margin each side, then keep the ones that fall in the month in Madrid.
  const from = new Date(Date.UTC(year, month - 1, 0)).toISOString();
  const to = new Date(Date.UTC(year, month, 2)).toISOString();
  const { data } = await db
    .from("tour_departures")
    .select("id, starts_at, capacity, seats_taken, status, price_cents, tours(id, title)")
    .gte("starts_at", from)
    .lt("starts_at", to)
    .order("starts_at")
    .limit(500);
  const departures: CalendarDeparture[] = (data ?? [])
    .filter((d) => TZ_DAY(d.starts_at).startsWith(prefix))
    .map((d) => ({
      id: d.id,
      startsAt: d.starts_at,
      capacity: d.capacity,
      seatsTaken: d.seats_taken,
      status: d.status,
      priceCents: d.price_cents,
      tourId: d.tours.id,
      tourTitle: d.tours.title,
    }));
  return { year, month, departures };
}

/** Owner only: paid sales per tour in the last 30 days, with their departures. */
async function loadPerformance(db: Db): Promise<TourPerf[]> {
  const now = Date.now();
  const { data: sold } = await db
    .from("bookings")
    .select("total_cents, travellers, tour_departures(tours(id, title))")
    .eq("status", "paid")
    .gte("created_at", new Date(now - 30 * 864e5).toISOString())
    .limit(5000);
  const map = new Map<string, TourPerf>();
  for (const b of sold ?? []) {
    const tour = b.tour_departures?.tours;
    if (!tour) continue;
    const row = map.get(tour.id) ?? {
      id: tour.id,
      title: tour.title,
      revenueCents: 0,
      bookings: 0,
      travellers: 0,
      departures: [],
    };
    row.revenueCents += b.total_cents;
    row.bookings += 1;
    row.travellers += b.travellers;
    map.set(tour.id, row);
  }
  const tours = [...map.values()].sort((a, b) => b.revenueCents - a.revenueCents).slice(0, 10);
  if (!tours.length) return [];
  const { data: deps } = await db
    .from("tour_departures")
    .select("id, tour_id, starts_at, capacity, seats_taken, status")
    .in(
      "tour_id",
      tours.map((t) => t.id),
    )
    .gte("starts_at", new Date(now - 90 * 864e5).toISOString())
    .lte("starts_at", new Date(now + 180 * 864e5).toISOString())
    .order("starts_at")
    .limit(1000);
  for (const d of deps ?? []) {
    map.get(d.tour_id)?.departures.push({
      id: d.id,
      startsAt: d.starts_at,
      capacity: d.capacity,
      seatsTaken: d.seats_taken,
      status: d.status,
    });
  }
  return tours;
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
