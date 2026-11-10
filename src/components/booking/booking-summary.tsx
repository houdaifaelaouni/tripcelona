import { Card } from "@/components/ui/card";
import type { BookingDetails } from "@/lib/booking/details";
import { formatDateLong, formatPrice, formatTime } from "@/lib/tours/format";

export function BookingSummary({ booking }: { booking: BookingDetails }) {
  const { departure, tour } = booking;
  return (
    <Card className="mt-6 p-5">
      <dl className="grid gap-3 sm:grid-cols-2">
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
          <dt className="text-sm text-muted">Total</dt>
          <dd className="text-2xl font-bold">{formatPrice(booking.totalCents)}</dd>
        </div>
      </dl>
    </Card>
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
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={capitalize ? "font-bold first-letter:uppercase" : "font-bold"}>{value}</dd>
    </div>
  );
}
