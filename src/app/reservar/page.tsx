import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/booking/checkout-form";
import { WhatsAppCta } from "@/components/tours/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { getCheckoutDeparture, getLiveDepartures } from "@/lib/booking/queries";
import { QUOTE_ERRORS, quoteDeparture } from "@/lib/booking/quote";
import { site } from "@/lib/site";
import { formatDateLong, formatPrice, formatTime } from "@/lib/tours/format";

export const metadata: Metadata = {
  title: "Reservar",
  robots: { index: false, follow: false },
};

export default function CheckoutPage({ searchParams }: PageProps<"/reservar">) {
  return (
    <div className="container-site py-8 md:py-12">
      <h1 className="text-3xl">Reserva tu excursión</h1>
      <Suspense fallback={<PageSkeleton />}>
        <Checkout searchParams={searchParams} />
      </Suspense>
    </div>
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
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
      <Card className="order-last p-5 md:p-6 lg:order-none">
        <h2 className="mb-4 text-xl">Tus datos</h2>
        <CheckoutForm
          departureId={departure.id}
          unitCents={quote.unitCents}
          seatsLeft={quote.seatsLeft}
          initialTravellers={travellers}
        />
      </Card>
      <aside>
        <Card className="p-5">
          <p className="text-sm text-muted">{departure.tour.area}</p>
          <h2 className="text-lg">{departure.tour.title}</h2>
          <dl className="mt-4 space-y-2">
            <div>
              <dt className="text-sm text-muted">Fecha</dt>
              <dd className="font-bold first-letter:uppercase">
                {formatDateLong(departure.startsAt)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Horario</dt>
              <dd className="font-bold">
                Salida {formatTime(departure.startsAt)}
                {departure.endsAt && ` · regreso aprox. ${formatTime(departure.endsAt)}`}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Punto de encuentro</dt>
              <dd>{departure.tour.meetingPoint ?? site.meetingPoint}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Precio por persona</dt>
              <dd className="font-bold">{formatPrice(quote.unitCents)}</dd>
            </div>
          </dl>
          <Link
            href={`/excursiones/${departure.tour.slug}`}
            className="mt-4 inline-block text-sm font-bold text-blue hover:underline"
          >
            Cambiar fecha
          </Link>
        </Card>
      </aside>
    </div>
  );
}

function NoDeparture() {
  return (
    <div className="mt-6 max-w-xl">
      <p className="text-muted">
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
      <p
        role="alert"
        className="rounded-control border border-danger bg-danger/5 p-3 font-bold text-danger"
      >
        {message}
      </p>
      <h2 className="mt-6 text-lg">{tour.title}</h2>
      {others.length > 0 ? (
        <>
          <p className="mt-1 text-muted">Estas fechas todavía tienen plazas:</p>
          <ul className="mt-3 space-y-2">
            {others.slice(0, 5).map((d) => (
              <li key={d.id}>
                <Link
                  href={`/reservar?salida=${d.id}`}
                  className="font-bold text-blue hover:underline first-letter:uppercase"
                >
                  {formatDateLong(d.startsAt)}
                </Link>{" "}
                <span className="text-sm text-muted">· {d.seatsLeft} plazas</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-1 text-muted">No hay otras fechas con plazas ahora mismo.</p>
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
