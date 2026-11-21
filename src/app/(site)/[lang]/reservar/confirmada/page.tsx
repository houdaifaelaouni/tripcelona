import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { BookingSummary } from "@/components/booking/booking-summary";
import { ClearCart } from "@/components/cart/clear-cart";
import { TrackOnMount } from "@/components/tracking/tracking";
import { Illustration } from "@/components/illustrations/illustration";
import { WhatsAppCta } from "@/components/tours/empty-state";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import Link from "@/components/i18n/link";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { getBookingDetails } from "@/lib/booking/details";
import { getTicketBundle } from "@/lib/booking/passengers";
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
      <>
        <Illustration name="lost" play="load" className="mb-4 aspect-[4/3] w-56 md:w-64" />
        <h1 className="text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
          {t("No encontramos esta reserva")}
        </h1>
      </>
    );

  if (booking.status === "pending") {
    return (
      <>
        <meta httpEquiv="refresh" content="5" />
        <Illustration name="phone" play="load" className="mb-4 aspect-[4/3] w-56 md:w-64" />
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
        <Illustration name="card" play="load" className="mb-4 aspect-[4/3] w-56 md:w-64" />
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
  const bundle = await getTicketBundle(booking);
  const meetingPoints = booking.cart
    ? booking.cart.lines.map((l) => ({
        key: l.id,
        label: l.title,
        point: l.meetingPoint ?? site.meetingPoint,
      }))
    : [{ key: booking.id, label: null, point: tour.meetingPoint ?? site.meetingPoint }];
  const purchaseItems = booking.cart
    ? booking.cart.lines.map((l) => ({
        id: l.slug,
        name: l.title,
        quantity: l.travellers,
        priceCents: Math.round(l.totalCents / l.travellers),
      }))
    : [
        {
          id: tour.slug,
          name: tour.title,
          quantity: booking.travellers,
          priceCents: Math.round(booking.totalCents / booking.travellers),
        },
      ];
  return (
    <>
      <ClearCart />
      <TrackOnMount
        name="Purchase"
        items={purchaseItems}
        eventId={booking.id}
        orderId={booking.reference}
        onceKey={`purchase-${booking.id}`}
      />
      <Illustration name="tickets" play="load" className="aspect-[4/3] w-60 md:w-72" />
      <p className="mt-2 text-sm font-semibold tracking-wide text-success uppercase">
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

      <section
        id="pasajeros"
        className="mt-8 scroll-mt-24 rounded-3xl border-2 border-dashed border-yellow bg-yellow/5 p-5 md:p-6"
      >
        <p className="text-sm font-semibold tracking-wide text-brand-secondary uppercase">
          E-ticket
        </p>
        <h2 className="mt-1 text-display-sm">{t("Tu ticket está listo")}</h2>
        <p className="mt-1 mb-4 text-tertiary">
          {t("Te lo hemos enviado por email. También puedes verlo y descargarlo aquí.")}
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/reservar/ticket/pdf?id=${booking.id}`}
            download
            className={buttonClasses({ size: "lg" })}
          >
            {t("Descargar ticket (PDF)")}
          </a>
          <ButtonLink href={`/reservar/ticket?id=${booking.id}`} size="lg" variant="secondary">
            {t("Ver mi ticket")}
          </ButtonLink>
        </div>
        <p className="mt-4 text-sm">
          <Link
            href={`/reservar/ticket?id=${booking.id}&editar=1`}
            className="font-medium text-brand-secondary underline"
          >
            {bundle.completedAt
              ? t("Editar pasajeros")
              : t("Añadir el nombre de cada viajero al ticket (opcional)")}
          </Link>
        </p>
      </section>

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
