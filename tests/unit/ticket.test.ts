import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import type { TicketBundle } from "@/lib/booking/passengers";
import type { BookingDetails } from "@/lib/booking/details";
import { confirmationEmail, ticketEmail } from "@/lib/email/templates";
import { buildTicketPdf, pdfSafe } from "@/lib/tickets/pdf";

const booking: BookingDetails = {
  id: "00000000-0000-4000-8000-000000000001",
  reference: "TC-2026-0042",
  status: "paid",
  customerName: "Núria Puig",
  email: "nuria@example.com",
  phone: null,
  travellers: 2,
  totalCents: 9800,
  pickupNote: null,
  cart: null,
  departure: { id: "d1", startsAt: "2026-12-20T07:00:00Z", endsAt: null, status: "open" },
  tour: {
    slug: "garrotxa",
    title: "Fageda d’en Jordà y Castellfollit — día completo",
    meetingPoint: "Estació del Nord, C/ d'Alí Bei 80, Barcelona",
    mapUrl: null,
    packingList: [],
    durationMinutes: null,
  },
};

const bundle = (passengers: number): TicketBundle => ({
  booking,
  completedAt: "2026-11-21T10:00:00Z",
  lines: [
    {
      bookingId: booking.id,
      reference: booking.reference,
      title: booking.tour.title,
      startsAt: booking.departure.startsAt,
      endsAt: null,
      travellers: passengers,
      meetingPoint: booking.tour.meetingPoint,
      passengers: Array.from({ length: passengers }, (_, i) => ({
        name: i ? `Viajero Ñandú ${i}` : "Núria Puig",
        documentId: i % 2 ? null : "12345678Z",
      })),
    },
  ],
});

describe("e-ticket PDF", () => {
  it("keeps Spanish/Catalan letters and drops what Helvetica cannot draw", () => {
    expect(pdfSafe("Núria · l·l — d’en ñ 🎉")).toBe("Núria · l·l - d'en ñ ");
  });

  it("draws one page per trip, also with 20 passengers", async () => {
    for (const n of [1, 20]) {
      const bytes = await buildTicketPdf(bundle(n));
      const pdf = await PDFDocument.load(bytes);
      expect(pdf.getPageCount()).toBe(1);
      expect(pdf.getTitle()).toContain(booking.reference);
    }
  });
});

describe("ticket emails", () => {
  it("lists every passenger and links the PDF", () => {
    const b = bundle(2);
    const email = ticketEmail(booking, b.lines, { ticket: "https://x/t", pdf: "https://x/p" });
    expect(email.subject).toContain(booking.reference);
    expect(email.html).toContain("Núria Puig");
    expect(email.html).toContain("Viajero Ñandú 1");
    expect(email.text).toContain("https://x/p");
  });

  it("confirmation asks for passengers when a link is given", () => {
    const urls = { booking: "https://x/b", calendar: "https://x/c" };
    expect(confirmationEmail(booking, urls).html).not.toContain("va adjunto");
    expect(confirmationEmail(booking, { ...urls, ticketPdf: "https://x/p" }).html).toContain(
      "va adjunto",
    );
  });
});
