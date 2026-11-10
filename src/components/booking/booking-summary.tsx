import type { BookingDetails } from "@/lib/booking/details";
import { formatDateLong, formatPrice, formatTime } from "@/lib/tours/format";

export function BookingSummary({ booking }: { booking: BookingDetails }) {
  const { departure, tour } = booking;
  return (
    <div className="mt-6 rounded-card border border-border bg-white p-6 shadow-float">
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <Item label="Referencia" value={booking.reference} />
        <Item label="Excursión" value={tour.title} />
        <Item label="Fecha" value={formatDateLong(departure.startsAt)} capitalize />
        <Item
          label="Salida"
          value={
            formatTime(departure.startsAt) +
            (departure.endsAt ? ` · regreso aprox. ${formatTime(departure.endsAt)}` : "")
          }
        />
        <Item label="Viajeros" value={String(booking.travellers)} />
        <div>
          <dt className="text-meta text-muted">Total</dt>
          <dd className="text-display-lg font-semibold">{formatPrice(booking.totalCents)}</dd>
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
      <dt className="text-meta text-muted">{label}</dt>
      <dd className={capitalize ? "font-semibold first-letter:uppercase" : "font-semibold"}>
        {value}
      </dd>
    </div>
  );
}
