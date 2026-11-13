import type { BookingDetails } from "@/lib/booking/details";
import { formatDateLong, formatPrice, formatTime } from "@/lib/tours/format";
import { createT } from "@/lib/i18n/translate";
import type { Locale } from "@/lib/i18n/config";

export function BookingSummary({
  booking,
  locale = "es",
}: {
  booking: BookingDetails;
  locale?: Locale;
}) {
  const t = createT(locale);
  const { departure, tour, cart } = booking;
  if (cart) {
    return (
      <div className="mt-6 rounded-xl border border-secondary bg-white p-6 shadow-lg">
        <ul className="divide-y divide-secondary">
          {cart.lines.map((l) => (
            <li key={l.id} className="flex items-start justify-between gap-4 py-3 first:pt-0">
              <div className="min-w-0">
                <p className="font-semibold">{l.title}</p>
                <p className="text-sm text-tertiary">
                  <span className="first-letter:uppercase">
                    {formatDateLong(l.startsAt, locale)}
                  </span>{" "}
                  · {t("Salida {time}", { time: formatTime(l.startsAt, locale) })} · {l.travellers}{" "}
                  {l.travellers === 1 ? t("viajero") : t("viajeros")}
                </p>
                <p className="text-sm text-tertiary">
                  {t("Referencia")} {l.reference}
                </p>
              </div>
              <p className="font-semibold whitespace-nowrap">{formatPrice(l.totalCents, locale)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-baseline justify-between border-t border-secondary pt-4">
          <span className="text-sm text-tertiary">{t("Total")}</span>
          <span className="text-display-lg font-semibold">
            {formatPrice(cart.totalCents, locale)}
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-xl border border-secondary bg-white p-6 shadow-lg">
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <Item label={t("Referencia")} value={booking.reference} />
        <Item label={t("Excursión")} value={tour.title} />
        <Item label={t("Fecha")} value={formatDateLong(departure.startsAt, locale)} capitalize />
        <Item
          label={t("Salida")}
          value={
            formatTime(departure.startsAt, locale) +
            (departure.endsAt
              ? ` · ${t("regreso aprox. {time}", { time: formatTime(departure.endsAt, locale) })}`
              : "")
          }
        />
        <Item label={t("Viajeros")} value={String(booking.travellers)} />
        <div>
          <dt className="text-sm text-tertiary">{t("Total")}</dt>
          <dd className="text-display-lg font-semibold">
            {formatPrice(booking.totalCents, locale)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Item({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div>
      <dt className="text-sm text-tertiary">{label}</dt>
      <dd className={capitalize ? "font-semibold first-letter:uppercase" : "font-semibold"}>
        {value}
      </dd>
    </div>
  );
}
