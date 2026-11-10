import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { WhatsAppCta } from "@/components/tours/empty-state";
import { Card } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateLong, formatPrice } from "@/lib/tours/format";

export const metadata: Metadata = { title: "Reserva pendiente de pago", robots: { index: false } };

/**
 * Landing page after checkout. Online payment (Redsys, decision D1) plugs in
 * here in Sprint 6; until then the booking stays pending and the seats are
 * released when the 15-minute hold expires.
 */
export default function PendingPage({ searchParams }: PageProps<"/reservar/pendiente">) {
  return (
    <div className="container-site max-w-2xl py-8 md:py-12">
      <Suspense fallback={<PageSkeleton />}>
        <Pending searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Pending({
  searchParams,
}: {
  searchParams: PageProps<"/reservar/pendiente">["searchParams"];
}) {
  await connection();
  const raw = (await searchParams).id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  const booking =
    id && /^[0-9a-f-]{36}$/i.test(id)
      ? (
          await createAdminClient()
            .from("bookings")
            .select(
              "reference, travellers, total_cents, status, tour_departures(starts_at, tours(title))",
            )
            .eq("id", id)
            .maybeSingle()
        ).data
      : null;

  if (!booking) {
    return <h1 className="text-2xl">No encontramos esta reserva</h1>;
  }

  return (
    <>
      <h1 className="text-3xl">Plazas reservadas</h1>
      <p className="mt-2 text-muted">
        Tu reserva <strong className="text-ink">{booking.reference}</strong> está pendiente de pago.
      </p>
      <Card className="mt-6 p-5">
        <dl className="space-y-2">
          <div>
            <dt className="text-sm text-muted">Excursión</dt>
            <dd className="font-bold">{booking.tour_departures.tours.title}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Fecha</dt>
            <dd className="font-bold first-letter:uppercase">
              {formatDateLong(booking.tour_departures.starts_at)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Viajeros</dt>
            <dd className="font-bold">{booking.travellers}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Total</dt>
            <dd className="text-2xl font-bold">{formatPrice(booking.total_cents)}</dd>
          </div>
        </dl>
      </Card>
      {/* TODO(S6, US-19): redirect to the Redsys payment page here. */}
      <p className="mt-6">
        El pago online con tarjeta se activa muy pronto. Mientras tanto, escríbenos por WhatsApp con
        tu referencia y te ayudamos a completar la reserva.
      </p>
      <div className="mt-4">
        <WhatsAppCta
          label="Completar por WhatsApp"
          message={`Hola, tengo la reserva ${booking.reference} pendiente de pago.`}
        />
      </div>
    </>
  );
}
