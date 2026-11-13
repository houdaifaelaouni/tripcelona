import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ClearCart } from "@/components/cart/clear-cart";
import { FormAlert } from "@/components/forms/form-bits";
import { BookingSummary } from "@/components/booking/booking-summary";
import { WhatsAppCta } from "@/components/tours/empty-state";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { getBookingDetails } from "@/lib/booking/details";
import { activeProvider } from "@/lib/payments/config";
import { createT } from "@/lib/i18n/translate";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/reservar/pendiente">): Promise<Metadata> {
  const { lang } = await params;
  const title = "Pago de tu reserva";
  return { title: isLocale(lang) ? createT(lang)(title) : title, robots: { index: false } };
}

const NOTICES: Record<string, string> = {
  error: "El pago no se ha completado. Puedes intentarlo de nuevo, con la misma u otra tarjeta.",
  no_seats: "Lo sentimos: mientras tanto se han agotado las plazas de esta salida.",
  not_configured: "El pago con tarjeta no está disponible ahora mismo.",
  not_pending: "Esta reserva ya no está pendiente de pago.",
  not_found: "No encontramos esta reserva.",
};

/** Step 2 of checkout: review and pay (US-19). */
export default function PendingPage({
  params,
  searchParams,
}: PageProps<"/[lang]/reservar/pendiente">) {
  return (
    <div className="container-site max-w-2xl py-8 md:py-16">
      <Suspense fallback={<PageSkeleton />}>
        <Pending params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

async function Pending({
  params: routeParams,
  searchParams,
}: {
  params: PageProps<"/[lang]/reservar/pendiente">["params"];
  searchParams: PageProps<"/[lang]/reservar/pendiente">["searchParams"];
}) {
  await connection();
  const { lang: locale } = await routeParams;
  if (!isLocale(locale)) notFound();
  const t = createT(locale);
  const params = await searchParams;
  const booking = await getBookingDetails({ id: first(params.id) });
  const noticeKey = NOTICES[first(params.pago)];
  const notice = noticeKey ? t(noticeKey) : undefined;

  if (!booking)
    return (
      <h1 className="text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
        {t("No encontramos esta reserva")}
      </h1>
    );

  if (booking.status === "paid") {
    return (
      <>
        <h1 className="text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
          {t("Esta reserva ya está pagada")}
        </h1>
        <BookingSummary booking={booking} locale={locale} />
        <div className="mt-6">
          <ButtonLink href={`/reservar/confirmada?id=${booking.id}`}>
            {t("Ver confirmación")}
          </ButtonLink>
        </div>
      </>
    );
  }

  if (booking.status !== "pending") {
    return (
      <>
        <h1 className="text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
          {t("Reserva cancelada")}
        </h1>
        <p className="mt-2 text-tertiary">
          {t("La reserva {ref} ya no está activa.", { ref: booking.reference })}
        </p>
        <div className="mt-6">
          <WhatsAppCta
            locale={locale}
            message={t("Hola, tengo una pregunta sobre la reserva {ref}.", {
              ref: booking.reference,
            })}
          />
        </div>
      </>
    );
  }

  const provider = await activeProvider();
  const canPay = provider !== null;
  return (
    <>
      <ClearCart />
      <h1 className="text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
        {t("Revisa y paga tu reserva")}
      </h1>
      <p className="mt-2 text-tertiary">
        {t(
          "Guardamos tus plazas durante 15 minutos. La reserva se confirma en cuanto el banco autoriza el pago.",
        )}
      </p>
      {notice && (
        <div className="mt-4">
          <FormAlert message={notice} />
        </div>
      )}
      <BookingSummary booking={booking} locale={locale} />
      {canPay ? (
        <form method="post" action="/api/pagos/iniciar" className="mt-6">
          <input type="hidden" name="bookingId" value={booking.id} />
          <input type="hidden" name="locale" value={locale} />
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            {t("Pagar con tarjeta")}
          </Button>
          <p className="mt-2 text-sm text-tertiary">
            {t("Pago seguro en la pasarela del banco ({provider}), con verificación 3D Secure.", {
              provider:
                provider === "stripe"
                  ? "Stripe"
                  : provider === "paycomet"
                    ? "Banco Sabadell"
                    : "Redsys",
            })}
          </p>
        </form>
      ) : (
        <p className="mt-6">
          {t(
            "El pago online no está disponible ahora mismo. Escríbenos por WhatsApp con tu referencia y te ayudamos a completar la reserva.",
          )}
        </p>
      )}
      <div className="mt-6">
        <WhatsAppCta
          label="¿Dudas? Escríbenos"
          locale={locale}
          message={t("Hola, tengo la reserva {ref} pendiente de pago.", { ref: booking.reference })}
        />
      </div>
    </>
  );
}
