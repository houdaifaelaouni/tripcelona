import { getBookingDetails } from "@/lib/booking/details";
import { bookingIcs } from "@/lib/booking/ics";
import { siteUrl } from "@/lib/seo/site-url";

/** .ics file for a paid booking; the unguessable booking id is the key. */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const booking = await getBookingDetails({ id });
  if (!booking || booking.status !== "paid") return new Response("Not found", { status: 404 });

  const ics = bookingIcs({
    uid: `${booking.id}@tripcelona.com`,
    title: `${booking.tour.title} (Tripcelona)`,
    startsAt: booking.departure.startsAt,
    endsAt: booking.departure.endsAt,
    durationMinutes: booking.tour.durationMinutes,
    location: booking.tour.meetingPoint,
    description: `Reserva ${booking.reference} · ${booking.travellers} viajero(s)`,
    url: `${siteUrl()}/reservar/confirmada?id=${booking.id}`,
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${booking.reference}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
