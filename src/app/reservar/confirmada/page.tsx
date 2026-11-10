import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { BookingSummary } from "@/components/booking/booking-summary";
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
    <div className="container-site max-w-2xl py-8 md:py-12">
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
  if (!booking) return <h1 className="text-2xl">No encontramos esta reserva</h1>;

  if (booking.status === "pending") {
    return (
      <>
        <meta httpEquiv="refresh" content="5" />
        <h1 className="text-3xl">Estamos confirmando tu pago…</h1>
        <p className="mt-2 text-muted" role="status">
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
        <h1 className="text-3xl">
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
  return (
    <>
      <p className="text-sm font-bold uppercase tracking-wide text-success">Pago recibido</p>
      <h1 className="mt-1 text-3xl">¡Reserva confirmada!</h1>
      <p className="mt-2 text-muted">
        Te hemos enviado la confirmación a <strong className="text-ink">{booking.email}</strong>. Si
        no la ves, revisa la carpeta de spam.
      </p>
      <BookingSummary booking={booking} />

      <section className="mt-8">
        <h2 className="text-xl">Punto de encuentro</h2>
        <p className="mt-1">{tour.meetingPoint ?? site.meetingPoint}</p>
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
          <h2 className="text-xl">Qué llevar</h2>
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
