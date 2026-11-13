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

export const metadata: Metadata = { title: "Reserva confirmada", robots: { index: false } };

/**
 * Redsys URLOK. The browser can arrive before the bank's notification, so a
 * pending booking shows a "confirming" state that refreshes itself.
 */
export default function ConfirmedPage({ searchParams }: PageProps<"/reservar/confirmada">) {
  return (
    <div className="container-site max-w-2xl py-8 md:py-16">
      <Suspense fallback={<PageSkeleton />}>
        <Confirmed searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Confirmed({
  searchParams,
}: {
  searchParams: PageProps<"/reservar/confirmada">["searchParams"];
}) {
  await connection();
  const raw = (await searchParams).id;
  const booking = await getBookingDetails({ id: (Array.isArray(raw) ? raw[0] : raw) ?? "" });
  if (!booking)
    return (
      <h1 className="text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
        No encontramos esta reserva
      </h1>
    );

  if (booking.status === "pending") {
    return (
      <>
        <meta httpEquiv="refresh" content="5" />
        <h1 className="text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
          Estamos confirmando tu pago…
        </h1>
        <p className="mt-2 text-tertiary" role="status">
          El banco nos está enviando la confirmación. Esta página se actualiza sola en unos
          segundos.
        </p>
        <BookingSummary booking={booking} />
      </>
    );
  }

  if (booking.status !== "paid") {
    return (
      <>
        <h1 className="text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
          Reserva {booking.status === "refunded" ? "reembolsada" : "cancelada"}
        </h1>
        <BookingSummary booking={booking} />
        <div className="mt-6">
          <WhatsAppCta
            message={`Hola, tengo una pregunta sobre la reserva ${booking.reference}.`}
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
        Pago recibido
      </p>
      <h1 className="mt-1 text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
        ¡Reserva confirmada!
      </h1>
      <p className="mt-2 text-tertiary">
        Te hemos enviado la confirmación a <strong className="text-primary">{booking.email}</strong>
        . Si no la ves, revisa la carpeta de spam.
      </p>
      <BookingSummary booking={booking} />

      <section className="mt-8">
        <h2 className="text-display-sm">Punto de encuentro</h2>
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
            Ver en el mapa
          </a>
        )}
      </section>

      {tour.packingList.length > 0 && (
        <section className="mt-6">
          <h2 className="text-display-sm">Qué llevar</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {tour.packingList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href={`/reservar/confirmada/calendario?id=${booking.id}`} variant="secondary">
          Añadir al calendario
        </ButtonLink>
        <WhatsAppCta
          label="Contactar por WhatsApp"
          message={`Hola, tengo la reserva ${booking.reference}.`}
        />
      </div>
    </>
  );
}
