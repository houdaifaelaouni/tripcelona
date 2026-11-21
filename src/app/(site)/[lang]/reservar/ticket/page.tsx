import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PassengerForm } from "@/components/booking/passenger-form";
import { TicketCard } from "@/components/booking/ticket-card";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { getBookingDetails } from "@/lib/booking/details";
import { getTicketBundle } from "@/lib/booking/passengers";
import { isLocale } from "@/lib/i18n/config";
import { createT } from "@/lib/i18n/translate";
import { formatDateLong, formatTime } from "@/lib/tours/format";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/reservar/ticket">): Promise<Metadata> {
  const { lang } = await params;
  const title = "Tu ticket";
  return { title: isLocale(lang) ? createT(lang)(title) : title, robots: { index: false } };
}

/** The customer's e-ticket: shown, downloadable as PDF, and editable. */
export default function TicketPage({ params, searchParams }: PageProps<"/[lang]/reservar/ticket">) {
  return (
    <div className="container-site max-w-2xl py-8 md:py-16">
      <Suspense fallback={<PageSkeleton />}>
        <Ticket params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Ticket({
  params,
  searchParams,
}: {
  params: PageProps<"/[lang]/reservar/ticket">["params"];
  searchParams: PageProps<"/[lang]/reservar/ticket">["searchParams"];
}) {
  await connection();
  const { lang: locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = createT(locale);
  const query = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const booking = await getBookingDetails({ id: one(query.id) });
  if (!booking || booking.status !== "paid") notFound();
  const bundle = await getTicketBundle(booking);
  const editing = one(query.editar) === "1";

  // No passengers yet (or editing): the form comes first.
  if (!bundle.completedAt || editing) {
    return (
      <>
        <h1 className="text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
          {editing ? t("Editar pasajeros") : t("Datos de los pasajeros")}
        </h1>
        <p className="mt-2 mb-6 text-tertiary">
          {t("Escribe el nombre de cada viajero. Te enviaremos el ticket a {email}.", {
            email: booking.email,
          })}
        </p>
        <PassengerForm
          bookingId={booking.id}
          customerName={booking.customerName}
          editing={editing}
          lines={bundle.lines.map((l) => ({
            bookingId: l.bookingId,
            title: l.title,
            when: `${formatDateLong(l.startsAt, locale)} · ${formatTime(l.startsAt, locale)}`,
            travellers: l.travellers,
            passengers: l.passengers,
          }))}
        />
      </>
    );
  }

  const sent = one(query.enviado) === "1";
  return (
    <>
      <p className="text-sm font-semibold tracking-wide text-success uppercase">
        {t("Ticket listo")}
      </p>
      <h1 className="mt-1 text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
        {t("Aquí tienes tu ticket")}
      </h1>
      <p className="mt-2 text-tertiary" role={sent ? "status" : undefined}>
        {sent
          ? t("Te lo hemos enviado a {email}. Si no lo ves, revisa la carpeta de spam.", {
              email: booking.email,
            })
          : t("Muéstralo en el móvil o impreso el día de la excursión.")}
      </p>
      <div className="mt-8 space-y-8">
        {bundle.lines.map((line, i) => (
          <TicketCard
            key={line.bookingId}
            line={line}
            locale={locale}
            index={i}
            count={bundle.lines.length}
          />
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        {/* A plain link: the PDF is a download, not a page. */}
        <a
          href={`/reservar/ticket/pdf?id=${booking.id}`}
          download
          className={buttonClasses({ size: "lg" })}
        >
          {t("Descargar ticket (PDF)")}
        </a>
        <ButtonLink
          href={`/reservar/ticket?id=${booking.id}&editar=1`}
          variant="secondary"
          size="lg"
        >
          {t("Editar pasajeros")}
        </ButtonLink>
        <ButtonLink
          href={`/reservar/confirmada/calendario?id=${booking.id}`}
          variant="secondary"
          size="lg"
        >
          {t("Añadir al calendario")}
        </ButtonLink>
      </div>
    </>
  );
}
