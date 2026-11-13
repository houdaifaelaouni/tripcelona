import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { BookingSummary } from "@/components/booking/booking-summary";
import { ClearCart } from "@/components/cart/clear-cart";
import { WhatsAppCta } from "@/components/tours/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { getBookingDetails } from "@/lib/booking/details";
import { site } from "@/lib/site";
import { createT } from "@/lib/i18n/translate";
import { isLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/reservar/confirmada">): Promise<Metadata> {
  const { lang } = await params;
  const title = "Reserva confirmada";
  return { title: isLocale(lang) ? createT(lang)(title) : title, robots: { index: false } };
}

/**
 * Redsys URLOK. The browser can arrive before the bank's notification, so a
 * pending booking shows a "confirming" state that refreshes itself.
 */
export default function ConfirmedPage({
  params,
  searchParams,
}: PageProps<"/[lang]/reservar/confirmada">) {
  return (
    <div className="container-site max-w-2xl py-8 md:py-16">
      <Suspense fallback={<PageSkeleton />}>
        <Confirmed params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Confirmed({
  params,
  searchParams,
}: {
  params: PageProps<"/[lang]/reservar/confirmada">["params"];
  searchParams: PageProps<"/[lang]/reservar/confirmada">["searchParams"];
}) {
  await connection();
  const { lang: locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = createT(locale);
  const raw = (await searchParams).id;
  const booking = await getBookingDetails({ id: (Array.isArray(raw) ? raw[0] : raw) ?? "" });
  if (!booking)
    return (
      <h1 className="text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
        {t("No encontramos esta reserva")}
      </h1>
    );

  if (booking.status === "pending") {
    return (
      <>
        <meta httpEquiv="refresh" content="5" />
        <h1 className="text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
          {t("Estamos confirmando tu pago…")}
        </h1>
        <p className="mt-2 text-tertiary" role="status">
          {t(
            "El banco nos está enviando la confirmación. Esta página se actualiza sola en unos segundos.",
          )}
        </p>
        <BookingSummary booking={booking} locale={locale} />
      </>
    );
  }

  if (booking.status !== "paid") {
    return (
      <>
        <h1 className="text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
          {booking.status === "refunded" ? t("Reserva reembolsada") : t("Reserva cancelada")}
        </h1>
        <BookingSummary booking={booking} locale={locale} />
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

  const { tour } = booking;
  const meetingPoints = booking.cart
    ? booking.cart.lines.map((l) => ({
        key: l.id,
        label: l.title,
        point: l.meetingPoint ?? site.meetingPoint,
      }))
    : [{ key: booking.id, label: null, point: tour.meetingPoint ?? site.meetingPoint }];
  return (
    <>
      <ClearCart />
      <span className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
        <CircleCheck aria-hidden size={28} />
      </span>
      <p className="mt-4 text-sm font-semibold tracking-wide text-success uppercase">
        {t("Pago recibido")}
      </p>
      <h1 className="mt-1 text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
        {t("¡Reserva confirmada!")}
      </h1>
      <p className="mt-2 text-tertiary">
        {t("Te hemos enviado la confirmación a")}{" "}
        <strong className="text-primary">{booking.email}</strong>.{" "}
        {t("Si no la ves, revisa la carpeta de spam.")}
      </p>
      <BookingSummary booking={booking} locale={locale} />

      <section className="mt-8">
        <h2 className="text-display-sm">{t("Punto de encuentro")}</h2>
        {meetingPoints.map((m) => (
          <p key={m.key} className="mt-1">
            {m.label && <strong>{m.label}: </strong>}
            {m.point}
          </p>
        ))}
        {tour.mapUrl && (
          <a
            className="mt-1 inline-block text-blue underline"
            href={tour.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("Ver en el mapa")}
          </a>
        )}
      </section>

      {tour.packingList.length > 0 && (
        <section className="mt-6">
          <h2 className="text-display-sm">{t("Qué llevar")}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {tour.packingList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href={`/reservar/confirmada/calendario?id=${booking.id}`} variant="secondary">
          {t("Añadir al calendario")}
        </ButtonLink>
        <WhatsAppCta
          label="Contactar por WhatsApp"
          locale={locale}
          message={t("Hola, tengo la reserva {ref}.", { ref: booking.reference })}
        />
      </div>
    </>
  );
}
