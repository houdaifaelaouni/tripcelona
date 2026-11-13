import type { Metadata } from "next";
import Link from "@/components/i18n/link";
import { CheckoutBand } from "@/components/booking/checkout-ui";
import { Suspense } from "react";
import { CartCheckout } from "@/components/cart/cart-checkout";
import { CheckoutForm } from "@/components/booking/checkout-form";
import { WhatsAppCta } from "@/components/tours/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { FormAlert } from "@/components/forms/form-bits";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { getCheckoutDeparture, getLiveDepartures } from "@/lib/booking/queries";
import { QUOTE_ERRORS, quoteDeparture } from "@/lib/booking/quote";
import { activeProvider } from "@/lib/payments/config";
import { site } from "@/lib/site";
import { formatDateLong, formatPrice, formatTime } from "@/lib/tours/format";
import { createT } from "@/lib/i18n/translate";
import { isLocale, localizePath, type Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/reservar">): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: isLocale(lang) ? createT(lang)("Reservar") : "Reservar",
    robots: { index: false, follow: false },
  };
}

export default function CheckoutPage({ params, searchParams }: PageProps<"/[lang]/reservar">) {
  return (
    <>
      <CheckoutBand current={2} />
      <div className="container-detail py-8 md:py-12">
        <Suspense fallback={<PageSkeleton />}>
          <Checkout params={params} searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

async function Checkout({
  params: routeParams,
  searchParams,
}: {
  params: PageProps<"/[lang]/reservar">["params"];
  searchParams: PageProps<"/[lang]/reservar">["searchParams"];
}) {
  const { lang: locale } = await routeParams;
  if (!isLocale(locale)) notFound();
  const t = createT(locale);
  const params = await searchParams;
  if (first(params.carrito) === "1") return <CartCheckout provider={await activeProvider()} />;
  const departureId = first(params.salida) ?? "";
  const travellers = Number.parseInt(first(params.personas) ?? "1", 10) || 1;
  const departure = departureId ? await getCheckoutDeparture(departureId) : null;

  if (!departure) return <NoDeparture locale={locale} />;

  const quote = quoteDeparture(departure, 1);
  if (!quote.ok) {
    const others = (await getLiveDepartures(departure.tour.slug)).filter(
      (d) => d.id !== departure.id && d.status === "open" && d.seatsLeft > 0,
    );
    return (
      <Unavailable
        message={QUOTE_ERRORS[quote.reason]}
        tour={departure.tour}
        others={others}
        locale={locale}
      />
    );
  }

  return (
    <div className="mt-2">
      <CheckoutForm
        departureId={departure.id}
        unitCents={quote.unitCents}
        seatsLeft={quote.seatsLeft}
        initialTravellers={travellers}
        provider={await activeProvider()}
        summary={
          <div className="mt-4">
            <p className="text-sm text-tertiary">
              {departure.tour.area ? t(departure.tour.area) : null}
            </p>
            <h3 className="text-base font-semibold text-primary">{departure.tour.title}</h3>
            <dl className="mt-3 divide-y divide-secondary border-t border-secondary text-sm">
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-tertiary">{t("Fecha")}</dt>
                <dd className="text-right font-semibold first-letter:uppercase">
                  {formatDateLong(departure.startsAt, locale)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-tertiary">{t("Horario")}</dt>
                <dd className="text-right font-semibold">
                  {t("Salida {time}", { time: formatTime(departure.startsAt, locale) })}
                  {departure.endsAt &&
                    ` · ${t("regreso {time}", { time: formatTime(departure.endsAt, locale) })}`}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-tertiary">{t("Punto de encuentro")}</dt>
                <dd className="max-w-[60%] text-right">
                  {departure.tour.meetingPoint ?? site.meetingPoint}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-tertiary">{t("Precio por persona")}</dt>
                <dd className="font-semibold">{formatPrice(quote.unitCents, locale)}</dd>
              </div>
            </dl>
            <Link
              href={`/excursiones/${departure.tour.slug}`}
              className="mt-2 inline-block text-sm font-semibold text-brand-secondary underline underline-offset-2"
            >
              {t("Cambiar fecha")}
            </Link>
          </div>
        }
      />
    </div>
  );
}

function NoDeparture({ locale }: { locale: Locale }) {
  const t = createT(locale);
  return (
    <div className="mt-6 max-w-xl">
      <p className="text-tertiary">
        {t("Primero elige una excursión y una fecha. Si prefieres, te ayudamos por WhatsApp.")}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink href="/ofertas-de-viajes">{t("Ver excursiones")}</ButtonLink>
        <WhatsAppCta message="Hola, quiero reservar una excursión." locale={locale} />
      </div>
    </div>
  );
}

function Unavailable({
  message,
  tour,
  others,
  locale,
}: {
  locale: Locale;
  message: string;
  tour: { slug: string; title: string };
  others: { id: string; startsAt: string; seatsLeft: number }[];
}) {
  const t = createT(locale);
  return (
    <div className="mt-6 max-w-xl">
      <FormAlert message={message} />
      <h2 className="mt-6 text-display-sm">{tour.title}</h2>
      {others.length > 0 ? (
        <>
          <p className="mt-1 text-tertiary">{t("Estas fechas todavía tienen plazas:")}</p>
          <ul className="mt-3 space-y-2">
            {others.slice(0, 5).map((d) => (
              <li key={d.id}>
                <Link
                  href={`/reservar?salida=${d.id}`}
                  className="font-semibold underline underline-offset-2 first-letter:uppercase"
                >
                  {formatDateLong(d.startsAt, locale)}
                </Link>{" "}
                <span className="text-sm text-tertiary">
                  · {t("{n} plazas", { n: d.seatsLeft })}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-1 text-tertiary">{t("No hay otras fechas con plazas ahora mismo.")}</p>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        <WhatsAppCta
          locale={locale}
          message={t("Hola, me interesa «{title}» pero la fecha está completa.", {
            title: tour.title,
          })}
        />
        <ButtonLink href="/ofertas-de-viajes" variant="outline">
          {t("Ver otras excursiones")}
        </ButtonLink>
      </div>
    </div>
  );
}
