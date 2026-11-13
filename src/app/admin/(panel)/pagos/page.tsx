import type { Metadata } from "next";
import { CreditCard, Clock, RotateCcw, XCircle } from "lucide-react";
import Link from "next/link";
import {
  EmptyState,
  PageTitle,
  Panel,
  StatCard,
  StatGrid,
  Table,
  td,
  th,
} from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/staff";
import { activeProvider, paycometConfig, redsysConfig, stripeConfig } from "@/lib/payments/config";
import { siteUrl } from "@/lib/seo/site-url";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/tours/format";

export const metadata: Metadata = { title: "Pagos" };

const PROVIDERS = {
  stripe: {
    label: "Stripe",
    configured: () => !!stripeConfig(),
    hook: "/api/pagos/stripe/webhook",
  },
  paycomet: {
    label: "PAYCOMET (Banco Sabadell)",
    configured: () => !!paycometConfig(),
    hook: "/api/pagos/paycomet/notificacion",
  },
  redsys: {
    label: "Redsys",
    configured: () => !!redsysConfig(),
    hook: "/api/pagos/redsys/notificacion",
  },
} as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  succeeded: "Cobrado",
  failed: "Fallido",
  refunded: "Devuelto",
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  });

/** Which gateway is live, whether each one is configured, and the latest payments. */
export default async function Payments() {
  await requireStaff("owner");
  const active = activeProvider();
  const wanted = process.env.PAYMENT_PROVIDER || "redsys";
  const db = await createClient();

  const [{ data: recent }, { data: events }] = await Promise.all([
    db
      .from("payments")
      .select(
        "id, provider, provider_ref, amount_cents, status, created_at, bookings(id, reference)",
      )
      .order("created_at", { ascending: false })
      .limit(50),
    db
      .from("payment_events")
      .select("provider, received_at")
      .order("received_at", { ascending: false })
      .limit(200),
  ]);

  const rows = recent ?? [];
  const sum = (status: string) =>
    rows.filter((p) => p.status === status).reduce((n, p) => n + p.amount_cents, 0);
  const count = (status: string) => rows.filter((p) => p.status === status).length;
  const lastEvent = (provider: string) => events?.find((e) => e.provider === provider)?.received_at;

  return (
    <>
      <PageTitle description="Estado de la pasarela de pago y los últimos 50 pagos.">
        Pagos
      </PageTitle>

      <StatGrid>
        <StatCard
          icon={CreditCard}
          label="Cobrado"
          value={formatPrice(sum("succeeded"))}
          hint={`${count("succeeded")} pagos`}
        />
        <StatCard
          icon={RotateCcw}
          label="Devuelto"
          value={formatPrice(sum("refunded"))}
          hint={`${count("refunded")} pagos`}
        />
        <StatCard
          icon={XCircle}
          label="Fallidos"
          value={String(count("failed"))}
          hint="intentos rechazados"
        />
        <StatCard
          icon={Clock}
          label="Pendientes"
          value={String(count("pending"))}
          hint="sin confirmar"
        />
      </StatGrid>

      <div className="mt-6">
        <Panel
          title="Pasarelas"
          description={
            active
              ? `Ahora se cobra con ${PROVIDERS[active].label}.`
              : `Variable PAYMENT_PROVIDER=${wanted}, pero faltan sus claves: la web ofrece WhatsApp en lugar de pagar con tarjeta.`
          }
        >
          <Table>
            <thead>
              <tr>
                <th className={th}>Pasarela</th>
                <th className={th}>Claves</th>
                <th className={th}>En uso</th>
                <th className={th}>Último aviso recibido</th>
                <th className={th}>URL de avisos</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(PROVIDERS) as (keyof typeof PROVIDERS)[]).map((k) => {
                const p = PROVIDERS[k];
                const last = lastEvent(k);
                return (
                  <tr key={k}>
                    <td className={td}>{p.label}</td>
                    <td className={td}>{p.configured() ? "Configuradas" : "Faltan"}</td>
                    <td className={td}>{active === k ? "Sí" : "No"}</td>
                    <td className={td}>{last ? when(last) : "Nunca"}</td>
                    <td className={`${td} font-mono text-xs`}>{siteUrl() + p.hook}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Últimos pagos">
          {rows.length ? (
            <Table>
              <thead>
                <tr>
                  <th className={th}>Fecha</th>
                  <th className={th}>Reserva</th>
                  <th className={th}>Pasarela</th>
                  <th className={th}>Importe</th>
                  <th className={th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className={`${td} whitespace-nowrap`}>{when(p.created_at)}</td>
                    <td className={td}>
                      <Link
                        href={`/admin/reservas/${p.bookings.id}`}
                        className="font-medium text-primary hover:text-brand-secondary"
                      >
                        {p.bookings.reference}
                      </Link>
                    </td>
                    <td className={td}>{p.provider}</td>
                    <td className={td}>{formatPrice(p.amount_cents)}</td>
                    <td className={td}>{STATUS_LABELS[p.status] ?? p.status}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState illustration="tickets" title="Aún no hay pagos">
              Aparecerán aquí en cuanto alguien intente pagar una reserva.
            </EmptyState>
          )}
        </Panel>
      </div>
    </>
  );
}
