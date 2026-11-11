import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { FormAlert } from "@/components/forms/form-bits";
import { BookingSummary } from "@/components/booking/booking-summary";
import { WhatsAppCta } from "@/components/tours/empty-state";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { getBookingDetails } from "@/lib/booking/details";
import { redsysConfig } from "@/lib/payments/config";

export const metadata: Metadata = { title: "Pago de tu reserva", robots: { index: false } };

const NOTICES: Record<string, string> = {
  error: "El pago no se ha completado. Puedes intentarlo de nuevo, con la misma u otra tarjeta.",
  no_seats: "Lo sentimos: mientras tanto se han agotado las plazas de esta salida.",
  not_configured: "El pago con tarjeta no está disponible ahora mismo.",
  not_pending: "Esta reserva ya no está pendiente de pago.",
  not_found: "No encontramos esta reserva.",
};

/** Step 2 of checkout: review and pay (US-19). */
export default function PendingPage({ searchParams }: PageProps<"/reservar/pendiente">) {
  return (
    <div className="container-site max-w-2xl py-8 md:py-16">
      <Suspense fallback={<PageSkeleton />}>
        <Pending searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

async function Pending({
  searchParams,
}: {
  searchParams: PageProps<"/reservar/pendiente">["searchParams"];
}) {
  await connection();
  const params = await searchParams;
  const booking = await getBookingDetails({ id: first(params.id) });
  const notice = NOTICES[first(params.pago)];

  if (!booking)
    return (
      <h1 className="text-3xl leading-[1.2] font-semibold tracking-tight text-primary md:text-4xl">
        No encontramos esta reserva
      </h1>
    );

  if (booking.status === "paid") {
    return (
      <>
        <h1 className="text-3xl leading-[1.2] font-semibold tracking-tight text-primary md:text-4xl">
          Esta reserva ya está pagada
        </h1>
        <BookingSummary booking={booking} />
        <div className="mt-6">
          <ButtonLink href={`/reservar/confirmada?id=${booking.id}`}>Ver confirmación</ButtonLink>
        </div>
      </>
    );
  }

  if (booking.status !== "pending") {
    return (
      <>
        <h1 className="text-3xl leading-[1.2] font-semibold tracking-tight text-primary md:text-4xl">
          Reserva cancelada
        </h1>
        <p className="mt-2 text-tertiary">
          La reserva <strong className="text-primary">{booking.reference}</strong> ya no está
          activa.
        </p>
        <div className="mt-6">
          <WhatsAppCta
            message={`Hola, tengo una pregunta sobre la reserva ${booking.reference}.`}
          />
        </div>
      </>
    );
  }

  const canPay = redsysConfig() !== null;
  return (
    <>
      <h1 className="text-3xl leading-[1.2] font-semibold tracking-tight text-primary md:text-4xl">
        Revisa y paga tu reserva
      </h1>
      <p className="mt-2 text-tertiary">
        Guardamos tus plazas durante 15 minutos. La reserva se confirma en cuanto el banco autoriza
        el pago.
      </p>
      {notice && (
        <div className="mt-4">
          <FormAlert message={notice} />
        </div>
      )}
      <BookingSummary booking={booking} />
      {canPay ? (
        <form method="post" action="/api/pagos/redsys/iniciar" className="mt-6">
          <input type="hidden" name="bookingId" value={booking.id} />
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            Pagar con tarjeta
          </Button>
          <p className="mt-2 text-sm text-tertiary">
            Pago seguro en la pasarela del banco (Redsys), con verificación 3D Secure.
          </p>
        </form>
      ) : (
        <p className="mt-6">
          El pago online no está disponible ahora mismo. Escríbenos por WhatsApp con tu referencia y
          te ayudamos a completar la reserva.
        </p>
      )}
      <div className="mt-6">
        <WhatsAppCta
          label="¿Dudas? Escríbenos"
          message={`Hola, tengo la reserva ${booking.reference} pendiente de pago.`}
        />
      </div>
    </>
  );
}
