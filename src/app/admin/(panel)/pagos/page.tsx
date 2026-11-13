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
import { Button } from "@/components/admin/button";
import { Flash } from "@/components/admin/flash";
import { Checkbox, Input, Select } from "@/components/admin/fields";
import { PasswordInput } from "@/components/admin/password-input";
import { SettingsRow } from "@/components/admin/settings";
import { savePaymentCredentials } from "@/lib/admin/payment-credentials-actions";
import { requireStaff } from "@/lib/auth/staff";
import {
  paymentEnv,
  savedPaymentValues,
  type PaymentEnv,
  type PaymentField,
} from "@/lib/payments/secrets";
import {
  activeProvider,
  paycometConfig,
  redsysConfig,
  stripeConfig,
  stripeKeyProblem,
} from "@/lib/payments/config";
import { siteUrl } from "@/lib/seo/site-url";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/tours/format";

export const metadata: Metadata = { title: "Pagos" };

const PROVIDERS = {
  stripe: {
    label: "Stripe",
    configured: (e: PaymentEnv) => stripeConfig(e),
    hook: "/api/pagos/stripe/webhook",
  },
  paycomet: {
    label: "PAYCOMET (Banco Sabadell)",
    configured: (e: PaymentEnv) => paycometConfig(e),
    hook: "/api/pagos/paycomet/notificacion",
  },
  redsys: {
    label: "Redsys",
    configured: (e: PaymentEnv) => redsysConfig(e),
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
export default async function Payments({ searchParams }: PageProps<"/admin/pagos">) {
  await requireStaff("owner");
  const { ok, error } = await searchParams;
  const env = await paymentEnv();
  const saved = await savedPaymentValues();
  const active = await activeProvider(env);
  const wanted = env.PAYMENT_PROVIDER || "redsys";
  const configured = {
    stripe: !!(await stripeConfig(env)),
    paycomet: !!(await paycometConfig(env)),
    redsys: !!(await redsysConfig(env)),
  };
  /** Where a setting comes from, never its value. */
  const source = (f: PaymentField) =>
    saved[f] ? "Guardada en el admin" : process.env[f] ? "En Vercel" : "Falta";
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

      <Flash ok={ok} error={error} />
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
              : `Está elegida la pasarela «${wanted}», pero faltan sus claves: la web ofrece WhatsApp en lugar de pagar con tarjeta.`
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
                    <td className={td}>
                      {configured[k] ? "Configuradas" : "Faltan"}
                      {k === "stripe" && stripeKeyProblem(env.STRIPE_SECRET_KEY) && (
                        <span className="mt-1 block text-error-primary">
                          {stripeKeyProblem(env.STRIPE_SECRET_KEY)}
                        </span>
                      )}
                    </td>
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
        <Panel
          title="Claves de pago"
          description="Pega aquí las claves de la pasarela y guarda. Se guardan cifradas y no se vuelven a mostrar. Deja un campo vacío para no cambiarlo."
        >
          <form action={savePaymentCredentials} autoComplete="off" className="px-4 pb-5 md:px-5">
            <SettingsRow
              label="Pasarela en uso"
              description="Con qué pasarela se cobra a los clientes."
            >
              <Select
                name="PAYMENT_PROVIDER"
                label="Pasarela"
                defaultValue=""
                hint={source("PAYMENT_PROVIDER")}
              >
                <option value="">No cambiar (ahora: {wanted})</option>
                <option value="stripe">Stripe</option>
                <option value="paycomet">PAYCOMET (Banco Sabadell)</option>
                <option value="redsys">Redsys</option>
              </Select>
            </SettingsRow>
            <SettingsRow
              label="Stripe"
              description="Stripe > Developers > API keys (clave secreta) y Webhooks (secreto de firma)."
            >
              <PasswordInput
                label="Clave secreta (sk_live_… o rk_live_…)"
                name="STRIPE_SECRET_KEY"
                autoComplete="off"
                placeholder={source("STRIPE_SECRET_KEY")}
              />
              <PasswordInput
                label="Secreto del webhook (whsec_…)"
                name="STRIPE_WEBHOOK_SECRET"
                autoComplete="off"
                placeholder={source("STRIPE_WEBHOOK_SECRET")}
              />
              <p className="text-sm text-tertiary">
                URL del webhook en Stripe:{" "}
                <span className="font-mono text-xs">{siteUrl() + PROVIDERS.stripe.hook}</span>
              </p>
              <Checkbox label="Quitar las claves de Stripe guardadas aquí" name="clear_stripe" />
            </SettingsRow>
            <SettingsRow
              label="PAYCOMET (Banco Sabadell)"
              description="Panel PAYCOMET > Mis productos > Configurar producto."
            >
              <PasswordInput
                label="API key"
                name="PAYCOMET_API_KEY"
                autoComplete="off"
                placeholder={source("PAYCOMET_API_KEY")}
              />
              <Input
                label="Terminal"
                name="PAYCOMET_TERMINAL"
                autoComplete="off"
                placeholder={source("PAYCOMET_TERMINAL")}
              />
              <Input
                label="Código de cliente (FUC)"
                name="PAYCOMET_CUSTOMER_CODE"
                autoComplete="off"
                placeholder={source("PAYCOMET_CUSTOMER_CODE")}
              />
              <PasswordInput
                label="Contraseña del producto"
                name="PAYCOMET_PASSWORD"
                autoComplete="off"
                placeholder={source("PAYCOMET_PASSWORD")}
              />
              <Checkbox
                label="Quitar las claves de PAYCOMET guardadas aquí"
                name="clear_paycomet"
              />
            </SettingsRow>
            <SettingsRow
              label="Redsys"
              description="Solo si usas Redsys en lugar de Stripe o PAYCOMET."
            >
              <Input
                label="Código de comercio"
                name="REDSYS_MERCHANT_CODE"
                autoComplete="off"
                placeholder={source("REDSYS_MERCHANT_CODE")}
              />
              <Input
                label="Terminal"
                name="REDSYS_TERMINAL"
                autoComplete="off"
                placeholder={source("REDSYS_TERMINAL")}
              />
              <PasswordInput
                label="Clave secreta"
                name="REDSYS_SECRET_KEY"
                autoComplete="off"
                placeholder={source("REDSYS_SECRET_KEY")}
              />
              <Select name="REDSYS_ENV" label="Entorno" defaultValue="" hint={source("REDSYS_ENV")}>
                <option value="">No cambiar</option>
                <option value="test">Pruebas</option>
                <option value="live">Real</option>
              </Select>
              <Checkbox label="Quitar las claves de Redsys guardadas aquí" name="clear_redsys" />
            </SettingsRow>
            <div className="mt-5 flex justify-end">
              <Button type="submit">Guardar claves</Button>
            </div>
          </form>
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
