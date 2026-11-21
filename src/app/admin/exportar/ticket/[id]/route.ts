import { checkStaff } from "@/lib/auth/staff";
import { getBookingDetails } from "@/lib/booking/details";
import { getTicketBundle } from "@/lib/booking/passengers";
import { buildTicketPdf } from "@/lib/tickets/pdf";

/** Staff: the e-ticket PDF of any booking, opened in the browser (not downloaded). */
export async function GET(_request: Request, ctx: RouteContext<"/admin/exportar/ticket/[id]">) {
  const check = await checkStaff("any");
  if (check.status !== "ok")
    return new Response(check.status === "forbidden" ? "Forbidden" : "Unauthorized", {
      status: check.status === "forbidden" ? 403 : 401,
    });
  const booking = await getBookingDetails({ id: (await ctx.params).id });
  if (!booking) return new Response("Not found", { status: 404 });
  const pdf = await buildTicketPdf(await getTicketBundle(booking));
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="tripcelona-ticket-${booking.reference}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
