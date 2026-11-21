import { ticketsPdf } from "@/lib/tickets/pdf";
import { getTicketBundle } from "@/lib/tickets/queries";

/** The PDF tickets of a paid booking (or cart), by its unguessable id. */
export async function GET(_req: Request, ctx: RouteContext<"/api/billetes/[id]">) {
  const { id } = await ctx.params;
  const bundle = await getTicketBundle(id);
  if (!bundle || bundle.anchor.status !== "paid" || !bundle.complete)
    return new Response("Not found", { status: 404 });
  const pdf = await ticketsPdf(bundle);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="billetes-${bundle.anchor.reference}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
