import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Illustration } from "@/components/illustrations/illustration";
import { TravellersForm } from "@/components/tickets/travellers-form";
import { ButtonLink } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { isLocale } from "@/lib/i18n/config";
import { createT } from "@/lib/i18n/translate";
import { site } from "@/lib/site";
import { prettyCode } from "@/lib/tickets/codes";
import { qrSvg } from "@/lib/tickets/pdf";
import { getTicketBundle, maskDocument } from "@/lib/tickets/queries";
import { formatDateLong, formatTime } from "@/lib/tours/format";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/reservar/billetes">): Promise<Metadata> {
  const { lang } = await params;
  const title = "Tus billetes";
  return { title: isLocale(lang) ? createT(lang)(title) : title, robots: { index: false } };
}

/**
 * After paying: the customer fills one row per traveller, then gets one
 * ticket per traveller with a QR (also emailed as PDF). The link carries the
 * booking's unguessable id, like the confirmation page.
 */
export default function TicketsPage({
  params,
  searchParams,
}: PageProps<"/[lang]/reservar/billetes">) {
  return (
    <div className="container-site max-w-3xl py-8 md:py-16">
      <Suspense fallback={<PageSkeleton />}>
        <Tickets params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function Tickets({
  params,
  searchParams,
}: {
  params: PageProps<"/[lang]/reservar/billetes">["params"];
  searchParams: PageProps<"/[lang]/reservar/billetes">["searchParams"];
}) {
  await connection();
  const { lang: locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = createT(locale);
  const sp = await searchParams;
  const bundle = await getTicketBundle(first(sp.id) ?? "");
  const h1 =
    "text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]";

  if (!bundle || bundle.anchor.status !== "paid")
    return (
      <>
        <Illustration name="lost" play="load" className="mb-4 aspect-[4/3] w-56 md:w-64" />
        <h1 className={h1}>{t("No encontramos billetes para esta reserva")}</h1>
        <p className="mt-2 text-tertiary">
          {t("Los billetes aparecen cuando el pago está confirmado.")}
        </p>
      </>
    );

  const when = (iso: string) => `${formatDateLong(iso, locale)} · ${formatTime(iso, locale)}`;
  const editing = first(sp.editar) === "1" && bundle.editable;

  if (!bundle.complete || editing)
    return (
      <>
        <p className="text-sm font-semibold tracking-wide text-brand-secondary uppercase">
          {t("Reserva {ref}", { ref: bundle.anchor.reference })}
        </p>
        <h1 className={`mt-1 ${h1}`}>{t("Datos de los viajeros")}</h1>
        <p className="mt-2 text-tertiary">
          {t(
            "Rellena los datos de cada viajero. Te daremos un billete con código QR por persona para enseñarlo al subir al autobús.",
          )}
        </p>
        <TravellersForm
          bookingId={bundle.anchor.id}
          customerName={bundle.anchor.customerName}
          trips={bundle.trips.map((trip) => ({
            bookingId: trip.bookingId,
            title: trip.title,
            when: when(trip.startsAt),
            travellers: trip.travellers,
            rows: trip.rows,
          }))}
        />
      </>
    );

  const tickets = await Promise.all(
    bundle.trips.flatMap((trip) =>
      trip.rows.map(async (r) => ({ trip, row: r, svg: await qrSvg(r.ticketCode!) })),
    ),
  );

  return (
    <>
      {first(sp.ok) === "1" && (
        <p
          role="status"
          className="mb-6 rounded-xl bg-success-primary px-4 py-3 text-sm font-medium text-success-primary"
        >
          {t("Guardado. Te hemos enviado los billetes a {email}.", { email: bundle.anchor.email })}
        </p>
      )}
      <h1 className={h1}>{t("Tus billetes")}</h1>
      <p className="mt-2 text-tertiary">
        {t("Enseña el código QR en el móvil o impreso al subir al autobús.")}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={`/api/billetes/${bundle.anchor.id}`}
          className="inline-flex items-center justify-center rounded-lg bg-brand-solid px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-solid_hover"
          download
        >
          {t("Descargar billetes (PDF)")}
        </a>
        {bundle.editable && (
          <ButtonLink
            href={`/reservar/billetes?id=${bundle.anchor.id}&editar=1`}
            variant="secondary"
          >
            {t("Editar viajeros")}
          </ButtonLink>
        )}
      </div>

      <ul className="mt-8 grid gap-5">
        {tickets.map(({ trip, row, svg }) => (
          <li
            key={row.id}
            className="grid overflow-hidden rounded-2xl bg-primary shadow-xs ring-1 ring-secondary md:grid-cols-[1fr_200px]"
          >
            <div className="border-t-4 border-brand p-5">
              <p className="text-xs font-semibold tracking-wide text-brand-secondary uppercase">
                {t("Billete")} · {t("Viajero {n}", { n: row.position })}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-primary">{trip.title}</h2>
              <dl className="mt-3 grid gap-2 text-sm">
                <div>
                  <dt className="text-tertiary">{t("Fecha")}</dt>
                  <dd className="font-medium text-primary first-letter:uppercase">
                    {when(trip.startsAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-tertiary">{t("Punto de encuentro")}</dt>
                  <dd className="font-medium text-primary">
                    {trip.meetingPoint ?? site.meetingPoint}
                  </dd>
                </div>
                <div className="flex flex-wrap gap-x-8 gap-y-2">
                  <div>
                    <dt className="text-tertiary">{t("Viajero")}</dt>
                    <dd className="font-semibold text-primary">{row.name}</dd>
                  </div>
                  <div>
                    <dt className="text-tertiary">{t("Documento")}</dt>
                    <dd className="font-medium text-primary">{maskDocument(row.documentId)}</dd>
                  </div>
                  <div>
                    <dt className="text-tertiary">{t("Reserva")}</dt>
                    <dd className="font-medium text-primary">{trip.reference}</dd>
                  </div>
                </div>
              </dl>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 border-t border-dashed border-secondary p-5 md:border-t-0 md:border-l">
              <div
                className="size-36 [&_svg]:size-full"
                role="img"
                aria-label={t("Código QR del billete")}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
              <p className="font-mono text-base font-semibold tracking-wider text-primary">
                {prettyCode(row.ticketCode!)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
