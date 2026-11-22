import type { Metadata } from "next";
import { BarChart3, Megaphone, MousePointerClick, Target } from "lucide-react";
import { Button } from "@/components/admin/button";
import { Checkbox, Input } from "@/components/admin/fields";
import { ConnectCard } from "@/components/admin/connect-card";
import { Flash } from "@/components/admin/flash";
import { PasswordInput } from "@/components/admin/password-input";
import { PageTitle, Panel, StatCard, StatGrid, Table, td, th } from "@/components/admin/ui";
import { UtmBuilder } from "@/components/admin/utm-builder";
import { saveIntegrations } from "@/lib/admin/integration-actions";
import { requireStaff } from "@/lib/auth/staff";
import { siteUrl } from "@/lib/seo/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/tours/format";
import { TRACKING_SETTING } from "@/lib/tracking/config";
import {
  integrationSecrets,
  savedIntegrationSecrets,
  type IntegrationSecret,
} from "@/lib/tracking/secrets";
import { trackingFromValue } from "@/lib/tracking/shared";

export const metadata: Metadata = { title: "Integraciones" };

const EVENTS: [string, string, string, string][] = [
  ["Ficha de una excursión", "ViewContent", "ViewContent", "view_item"],
  ["Añadir al carrito", "AddToCart", "AddToCart", "add_to_cart"],
  ["Abrir el pago (reserva o carrito)", "InitiateCheckout", "InitiateCheckout", "begin_checkout"],
  [
    "Pago confirmado",
    "Purchase (+ servidor)",
    "CompletePayment (+ servidor)",
    "purchase + conversión Ads",
  ],
];

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 3600 * 1000).toISOString();

type Row = {
  key: string;
  source: string;
  medium: string;
  campaign: string;
  bookings: number;
  pax: number;
  cents: number;
};

/**
 * The media buyer's page: pixel ids, Conversions API tokens, which events
 * fire, a UTM link builder and paid sales per campaign.
 */
export default async function Integrations({ searchParams }: PageProps<"/admin/integraciones">) {
  await requireStaff("any");
  const { ok, error } = await searchParams;
  const db = createAdminClient();
  const since = daysAgo(90);

  const [{ data: setting }, saved, secrets, { data: sales }, { data: landings }] =
    await Promise.all([
      db.from("settings").select("value").eq("key", TRACKING_SETTING).maybeSingle(),
      savedIntegrationSecrets(),
      integrationSecrets(),
      // Aggregates only: the media buyer sees totals per campaign, no customer data.
      db
        .from("bookings")
        .select("attribution, travellers, total_cents")
        .eq("status", "paid")
        .gte("created_at", since)
        .limit(5000),
      db
        .from("landing_pages")
        .select("slug, title")
        .eq("status", "published")
        .order("created_at", { ascending: false }),
    ]);
  const config = trackingFromValue(setting?.value);
  const tokenHint = (k: IntegrationSecret) =>
    saved[k] ? "Guardado (cifrado)" : process.env[k] ? "En Vercel" : "Falta";

  const groups = new Map<string, Row>();
  for (const b of sales ?? []) {
    const a = (b.attribution ?? {}) as Record<string, unknown>;
    const s = (k: string) => (typeof a[k] === "string" ? (a[k] as string) : "");
    const source = s("utm_source") || "(directo)";
    const medium = s("utm_medium") || "-";
    const campaign = s("utm_campaign") || "-";
    const key = `${source}|${medium}|${campaign}`;
    const row = groups.get(key) ?? { key, source, medium, campaign, bookings: 0, pax: 0, cents: 0 };
    row.bookings += 1;
    row.pax += b.travellers;
    row.cents += b.total_cents;
    groups.set(key, row);
  }
  const rows = [...groups.values()].sort((x, y) => y.cents - x.cents);
  const paidCents = rows.filter((r) => r.source !== "(directo)").reduce((n, r) => n + r.cents, 0);
  const totalCents = rows.reduce((n, r) => n + r.cents, 0);

  const base = siteUrl();
  const pages = [
    { label: "Página de inicio", url: `${base}/` },
    { label: "Ofertas de viajes (catálogo)", url: `${base}/ofertas-de-viajes` },
    ...(landings ?? []).map((l) => ({ label: `Landing: ${l.title}`, url: `${base}/l/${l.slug}` })),
  ];

  return (
    <>
      <PageTitle description="Píxeles de Meta, TikTok y Google, la API de conversiones y las ventas por campaña. Los píxeles solo se cargan a los visitantes que aceptan las cookies.">
        Integraciones
      </PageTitle>
      <Flash ok={ok} error={error} />

      <StatGrid>
        <StatCard
          icon={Megaphone}
          label="Meta"
          value={config.metaPixelId ? "Píxel activo" : "Sin píxel"}
          hint={secrets.META_CAPI_TOKEN ? "API de conversiones: sí" : "API de conversiones: no"}
        />
        <StatCard
          icon={MousePointerClick}
          label="TikTok"
          value={config.tiktokPixelId ? "Píxel activo" : "Sin píxel"}
          hint={secrets.TIKTOK_EVENTS_TOKEN ? "Events API: sí" : "Events API: no"}
        />
        <StatCard
          icon={Target}
          label="Google"
          value={config.gtmId || config.ga4Id || config.googleAdsId ? "Activo" : "Sin configurar"}
          hint={
            [config.gtmId && "GTM", config.ga4Id && "GA4", config.googleAdsId && "Ads"]
              .filter(Boolean)
              .join(" · ") || "GTM, GA4 o Ads"
          }
        />
        <StatCard
          icon={BarChart3}
          label="Ventas con campaña (90 días)"
          value={formatPrice(paidCents)}
          hint={`de ${formatPrice(totalCents)} vendidos`}
        />
      </StatGrid>

      <form action={saveIntegrations} autoComplete="off" className="mt-6">
        <div className="mb-4">
          <h2 className="text-md font-semibold tracking-tight text-primary">
            Conectar plataformas
          </h2>
          <p className="mt-0.5 text-sm text-tertiary">
            Pega los IDs y tokens de cada plataforma. Los tokens se guardan cifrados y no se vuelven
            a mostrar: deja el campo vacío para no cambiarlo.
          </p>
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          <ConnectCard
            mark="Meta"
            name="Meta (Facebook e Instagram)"
            active={!!config.metaPixelId}
            events={[
              ["ViewContent", "Ficha de una excursión"],
              ["AddToCart · InitiateCheckout", "Carrito y pago"],
              ["Purchase", "Pago confirmado, también desde el servidor"],
            ]}
            help="Administrador de eventos > Orígenes de datos > tu píxel. El token se genera en Configuración > API de conversiones."
            id={
              <Input
                label="ID del píxel"
                name="metaPixelId"
                defaultValue={config.metaPixelId ?? ""}
                inputMode="numeric"
                placeholder="123456789012345"
              />
            }
          >
            <PasswordInput
              label="Token de la API de conversiones"
              name="META_CAPI_TOKEN"
              autoComplete="off"
              placeholder={tokenHint("META_CAPI_TOKEN")}
            />
            <Input
              label="Código de evento de prueba (opcional)"
              name="META_TEST_EVENT_CODE"
              autoComplete="off"
              placeholder={
                saved.META_TEST_EVENT_CODE
                  ? "Guardado: los eventos de servidor van a «Probar eventos»"
                  : "TEST12345"
              }
              hint="Mientras esté puesto, las compras del servidor salen en «Probar eventos» y no cuentan. Quítalo al terminar de probar."
            />
            <Checkbox label="Quitar el token guardado" name="clear_META_CAPI_TOKEN" />
            <Checkbox label="Quitar el código de prueba" name="clear_META_TEST_EVENT_CODE" />
          </ConnectCard>

          <ConnectCard
            mark="TT"
            name="TikTok"
            active={!!config.tiktokPixelId}
            events={[
              ["ViewContent", "Ficha de una excursión"],
              ["AddToCart · InitiateCheckout", "Carrito y pago"],
              ["CompletePayment", "Pago confirmado, también desde el servidor"],
            ]}
            help="TikTok Ads Manager > Herramientas > Eventos > Web > tu píxel. El token está en Configuración > Events API."
            id={
              <Input
                label="ID del píxel"
                name="tiktokPixelId"
                defaultValue={config.tiktokPixelId ?? ""}
                placeholder="C1A2B3C4D5E6F7G8H9I0"
              />
            }
          >
            <PasswordInput
              label="Token de la Events API"
              name="TIKTOK_EVENTS_TOKEN"
              autoComplete="off"
              placeholder={tokenHint("TIKTOK_EVENTS_TOKEN")}
            />
            <Input
              label="Código de evento de prueba (opcional)"
              name="TIKTOK_TEST_EVENT_CODE"
              autoComplete="off"
              placeholder={saved.TIKTOK_TEST_EVENT_CODE ? "Guardado" : "TEST12345"}
            />
            <Checkbox label="Quitar el token guardado" name="clear_TIKTOK_EVENTS_TOKEN" />
            <Checkbox label="Quitar el código de prueba" name="clear_TIKTOK_TEST_EVENT_CODE" />
          </ConnectCard>

          <ConnectCard
            mark="G"
            name="Google"
            active={!!(config.gtmId || config.ga4Id || config.googleAdsId)}
            events={[
              ["view_item", "Ficha de una excursión"],
              ["add_to_cart · begin_checkout", "Carrito y pago"],
              ["purchase", "Pago confirmado y conversión de Ads"],
            ]}
            help="Usa GTM si quieres montar tú las etiquetas, o pon directamente GA4 y Google Ads. Con los dos a la vez, no repitas las mismas etiquetas dentro de GTM."
            id={
              <Input
                label="Google Tag Manager"
                name="gtmId"
                defaultValue={config.gtmId ?? ""}
                placeholder="GTM-XXXXXXX"
              />
            }
          >
            <Input
              label="Google Analytics 4 (ID de medición)"
              name="ga4Id"
              defaultValue={config.ga4Id ?? ""}
              placeholder="G-XXXXXXXXXX"
            />
            <Input
              label="Google Ads (ID de conversión)"
              name="googleAdsId"
              defaultValue={config.googleAdsId ?? ""}
              placeholder="AW-123456789"
            />
            <Input
              label="Etiqueta de la conversión «Compra»"
              name="googleAdsPurchaseLabel"
              defaultValue={config.googleAdsPurchaseLabel ?? ""}
              placeholder="AbC-D_efG-h12_34-567"
              hint="Google Ads > Objetivos > Conversiones > tu acción de compra > Configuración de etiqueta."
            />
          </ConnectCard>
        </div>
        <div className="mt-6 flex flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
          <p className="text-xs text-tertiary">
            Se guarda todo junto. Los píxeles solo se cargan con cookies aceptadas.
          </p>
          <Button type="submit">Guardar integraciones</Button>
        </div>
      </form>

      <div className="mt-6">
        <Panel
          title="Eventos que envía la web"
          description="Con el ID de pedido y el mismo ID de evento en el navegador y en el servidor, así Meta y TikTok cuentan cada compra una sola vez. Valor en EUR."
        >
          <Table>
            <thead>
              <tr>
                <th className={th}>Cuándo</th>
                <th className={th}>Meta</th>
                <th className={th}>TikTok</th>
                <th className={th}>Google (GA4 / dataLayer)</th>
              </tr>
            </thead>
            <tbody>
              {EVENTS.map(([when, meta, tiktok, google]) => (
                <tr key={when}>
                  <td className={td}>{when}</td>
                  <td className={`${td} font-mono text-xs`}>{meta}</td>
                  <td className={`${td} font-mono text-xs`}>{tiktok}</td>
                  <td className={`${td} font-mono text-xs`}>{google}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="Enlaces con UTM"
          description="Cada venta guarda la campaña de la que vino el cliente (último clic de anuncio, 90 días). Etiqueta siempre los enlaces de tus anuncios."
        >
          <UtmBuilder pages={pages} />
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="Ventas por campaña (últimos 90 días)"
          description="Solo reservas pagadas. Las reservas anteriores a esta función salen como «directo»."
        >
          {rows.length ? (
            <Table>
              <thead>
                <tr>
                  <th className={th}>Fuente</th>
                  <th className={th}>Medio</th>
                  <th className={th}>Campaña</th>
                  <th className={th}>Reservas</th>
                  <th className={th}>Personas</th>
                  <th className={th}>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <td className={td}>{r.source}</td>
                    <td className={td}>{r.medium}</td>
                    <td className={td}>{r.campaign}</td>
                    <td className={td}>{r.bookings}</td>
                    <td className={td}>{r.pax}</td>
                    <td className={`${td} font-medium`}>{formatPrice(r.cents)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="px-4 pb-5 text-sm text-tertiary md:px-5">
              Todavía no hay reservas pagadas en estos 90 días.
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}
