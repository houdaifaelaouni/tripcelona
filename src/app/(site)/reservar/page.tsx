import type { Metadata } from "next";
import Link from "next/link";
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

export const metadata: Metadata = {
  title: "Reservar",
  robots: { index: false, follow: false },
};

export default function CheckoutPage({ searchParams }: PageProps<"/reservar">) {
  return (
    <>
      <CheckoutBand current={2} />
      <div className="container-detail py-8 md:py-12">
        <Suspense fallback={<PageSkeleton />}>
          <Checkout searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

async function Checkout({
  searchParams,
}: {
  searchParams: PageProps<"/reservar">["searchParams"];
}) {
  const params = await searchParams;
  if (first(params.carrito) === "1") return <CartCheckout provider={activeProvider()} />;
  const departureId = first(params.salida) ?? "";
  const travellers = Number.parseInt(first(params.personas) ?? "1", 10) || 1;
  const departure = departureId ? await getCheckoutDeparture(departureId) : null;

  if (!departure) return <NoDeparture />;

  const quote = quoteDeparture(departure, 1);
  if (!quote.ok) {
    const others = (await getLiveDepartures(departure.tour.slug)).filter(
      (d) => d.id !== departure.id && d.status === "open" && d.seatsLeft > 0,
    );
    return (
      <Unavailable message={QUOTE_ERRORS[quote.reason]} tour={departure.tour} others={others} />
    );
  }

  return (
    <div className="mt-2">
      <CheckoutForm
        departureId={departure.id}
        unitCents={quote.unitCents}
        seatsLeft={quote.seatsLeft}
        initialTravellers={travellers}
        provider={activeProvider()}
        summary={
          <div className="mt-4">
            <p className="text-sm text-tertiary">{departure.tour.area}</p>
            <h3 className="text-base font-semibold text-primary">{departure.tour.title}</h3>
            <dl className="mt-3 divide-y divide-secondary border-t border-secondary text-sm">
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-tertiary">Fecha</dt>
                <dd className="text-right font-semibold first-letter:uppercase">
                  {formatDateLong(departure.startsAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-tertiary">Horario</dt>
                <dd className="text-right font-semibold">
                  Salida {formatTime(departure.startsAt)}
                  {departure.endsAt && ` · regreso ${formatTime(departure.endsAt)}`}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-tertiary">Punto de encuentro</dt>
                <dd className="max-w-[60%] text-right">
                  {departure.tour.meetingPoint ?? site.meetingPoint}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-tertiary">Precio por persona</dt>
                <dd className="font-semibold">{formatPrice(quote.unitCents)}</dd>
              </div>
            </dl>
            <Link
              href={`/excursiones/${departure.tour.slug}`}
              className="mt-2 inline-block text-sm font-semibold text-brand-secondary underline underline-offset-2"
            >
              Cambiar fecha
            </Link>
          </div>
        }
      />
    </div>
  );
}

function NoDeparture() {
  return (
    <div className="mt-6 max-w-xl">
      <p className="text-tertiary">
        Primero elige una excursión y una fecha. Si prefieres, te ayudamos por WhatsApp.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink href="/ofertas-de-viajes">Ver excursiones</ButtonLink>
        <WhatsAppCta message="Hola, quiero reservar una excursión." />
      </div>
    </div>
  );
}

function Unavailable({
  message,
  tour,
  others,
}: {
  message: string;
  tour: { slug: string; title: string };
  others: { id: string; startsAt: string; seatsLeft: number }[];
}) {
  return (
    <div className="mt-6 max-w-xl">
      <FormAlert message={message} />
      <h2 className="mt-6 text-display-sm">{tour.title}</h2>
      {others.length > 0 ? (
        <>
          <p className="mt-1 text-tertiary">Estas fechas todavía tienen plazas:</p>
          <ul className="mt-3 space-y-2">
            {others.slice(0, 5).map((d) => (
              <li key={d.id}>
                <Link
                  href={`/reservar?salida=${d.id}`}
                  className="font-semibold underline underline-offset-2 first-letter:uppercase"
                >
                  {formatDateLong(d.startsAt)}
                </Link>{" "}
                <span className="text-sm text-tertiary">· {d.seatsLeft} plazas</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-1 text-tertiary">No hay otras fechas con plazas ahora mismo.</p>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        <WhatsAppCta message={`Hola, me interesa "${tour.title}" pero la fecha está completa.`} />
        <ButtonLink href="/ofertas-de-viajes" variant="outline">
          Ver otras excursiones
        </ButtonLink>
      </div>
    </div>
  );
}
