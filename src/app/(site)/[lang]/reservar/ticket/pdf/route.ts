import { getBookingDetails } from "@/lib/booking/details";
import { getTicketBundle } from "@/lib/booking/passengers";
import { buildTicketPdf } from "@/lib/tickets/pdf";

/** The e-ticket PDF of a paid booking; the unguessable booking id is the key. */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const booking = await getBookingDetails({ id });
  if (!booking || booking.status !== "paid") return new Response("Not found", { status: 404 });
  const pdf = await buildTicketPdf(await getTicketBundle(booking));
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="tripcelona-ticket-${booking.reference}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
