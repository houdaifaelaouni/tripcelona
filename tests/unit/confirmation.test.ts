import { describe, expect, it } from "vitest";
import { bookingIcs } from "@/lib/booking/ics";
import {
  cancellationEmail,
  confirmationEmail,
  ownerAlertEmail,
  paymentFailedEmail,
  type EmailBooking,
} from "@/lib/email/templates";

const booking: EmailBooking = {
  id: "6e16dbcc-5848-4289-8bcb-e49a04d25306",
  reference: "TC-2026-0002",
  customerName: "Ana <script>",
  email: "ana@example.com",
  phone: "+34 600 000 000",
  travellers: 3,
  totalCents: 16500,
  pickupNote: null,
  departure: { startsAt: "2026-11-22T07:00:00Z", endsAt: "2026-11-22T17:30:00Z" },
  tour: {
    slug: "rupit",
    title: "Rupit y Tavertet",
    meetingPoint: "Estació del Nord, C/ d'Alí Bei 80, Barcelona",
    packingList: ["Calzado cómodo", "Agua"],
  },
};

describe("booking .ics", () => {
  const ics = bookingIcs({
    uid: `${booking.id}@tripcelona.com`,
    title: "Rupit y Tavertet; día completo, con guía",
    startsAt: booking.departure.startsAt,
    endsAt: null,
    durationMinutes: 630,
    location: booking.tour.meetingPoint,
    description: "Reserva TC-2026-0002",
    url: "https://tripcelona.com/reservar/confirmada?id=x",
    now: new Date("2026-11-10T12:00:00Z"),
  });

  it("is a valid VEVENT in UTC with CRLF line endings", () => {
    expect(ics).toMatch(/^BEGIN:VCALENDAR\r\n/);
    expect(ics).toContain("DTSTART:20261122T070000Z\r\n");
    expect(ics).toContain("DTEND:20261122T173000Z\r\n"); // start + 630 min
    expect(ics).toContain(String.raw`SUMMARY:Rupit y Tavertet\; día completo\, con guía`);
    expect(ics.split("\r\n").every((l) => Buffer.byteLength(l) <= 75)).toBe(true);
  });
});

describe("booking emails", () => {
  it("confirmation has reference, date, meeting point and what to bring", () => {
    const e = confirmationEmail(booking, { booking: "https://b", calendar: "https://c" });
    expect(e.subject).toContain("TC-2026-0002");
    for (const part of [
      "TC-2026-0002",
      "Domingo, 22 de noviembre de 2026",
      "08:00",
      "Estació del Nord",
      "Calzado cómodo",
      "165",
    ]) {
      expect(e.text).toContain(part);
    }
    expect(e.html).not.toContain("<script>");
    expect(e.html).toContain("Ana &lt;script&gt;");
  });

  it("owner alert includes customer contact", () => {
    const e = ownerAlertEmail(booking);
    expect(e.text).toContain("ana@example.com");
    expect(e.subject).toContain("3 pax");
  });

  it("payment failed links to retry, cancellation states refund", () => {
    expect(paymentFailedEmail(booking, "https://retry").text).toContain("https://retry");
    expect(cancellationEmail(booking, true).text).toContain("devuelto");
    expect(cancellationEmail(booking, false).text).not.toContain("Importe devuelto");
    expect(cancellationEmail(booking, true, "booking").subject).toMatch(/^Reserva cancelada/);
    expect(cancellationEmail(booking, true).subject).toMatch(/^Salida cancelada/);
  });
});
