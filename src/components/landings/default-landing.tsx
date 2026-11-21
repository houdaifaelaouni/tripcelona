import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { TourCard } from "@/components/tours/tour-card";
import { createT } from "@/lib/i18n/translate";
import type { Locale } from "@/lib/i18n/config";
import type { Landing } from "@/lib/landings/queries";
import type { TourSummary } from "@/lib/tours/types";
import { formatDateLong, formatPrice } from "@/lib/tours/format";

export type LandingProps = {
  landing: Landing;
  tour: TourSummary | null;
  locale: Locale;
  meetingPoint: string;
  phoneDisplay: string;
};

/**
 * The page every landing shows until the owner designs its own version
 * (see components/landings/designs). Only the title the media buyer typed
 * and real tour data: no invented claims.
 */
export function DefaultLanding({
  landing,
  tour,
  locale,
  meetingPoint,
  phoneDisplay,
}: LandingProps) {
  const t = createT(locale);
  const next = tour?.departures.find((d) => d.status === "open" && d.seatsLeft > 0) ?? null;
  const cta = tour ? `/excursiones/${tour.slug}` : "/ofertas-de-viajes";
  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand-section">
        {tour?.image && (
          <Image
            src={tour.image.url}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover opacity-35"
          />
        )}
        <div className="container-site py-16 md:py-24">
          <h1 className="max-w-3xl text-4xl leading-[1.1] font-semibold tracking-[-0.03em] text-white md:text-6xl">
            {landing.title}
          </h1>
          {tour?.summary && <p className="mt-4 max-w-2xl text-lg text-white/85">{tour.summary}</p>}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ButtonLink href={cta} size="lg">
              {tour ? t("Reservar plaza") : t("Ver excursiones")}
            </ButtonLink>
            {next && (
              <p className="text-sm text-white/85">
                {t("Próxima salida")}:{" "}
                <strong className="text-white first-letter:uppercase">
                  {formatDateLong(next.startsAt, locale)}
                </strong>{" "}
                · {formatPrice(next.priceCents)}
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="container-site grid gap-10 py-12 md:grid-cols-[1fr_380px] md:py-16">
        <ul className="grid content-start gap-4 text-primary">
          <li>
            <p className="font-semibold">{t("Punto de encuentro")}</p>
            <p className="text-tertiary">{meetingPoint}</p>
          </li>
          <li>
            <p className="font-semibold">{t("Ticket por email")}</p>
            <p className="text-tertiary">
              {t("Después de pagar recibes el ticket con código QR por email.")}
            </p>
          </li>
          <li>
            <p className="font-semibold">{t("¿Dudas?")}</p>
            <p className="text-tertiary">{phoneDisplay}</p>
          </li>
        </ul>
        {tour && <TourCard tour={tour} locale={locale} departure={next} priority />}
      </section>
    </>
  );
}
