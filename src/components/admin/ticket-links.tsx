import { siteUrl } from "@/lib/seo/site-url";
import { ticketWhatsappMessage, whatsappTicketHref } from "@/lib/tickets/display";
import { formatDateLong, formatTime } from "@/lib/tours/format";

/** Booking reference that opens the booking's e-ticket PDF in a new tab. */
export function TicketRefLink({
  id,
  reference,
  className,
}: {
  id: string;
  reference: string;
  className?: string;
}) {
  return (
    <a
      href={`/admin/exportar/ticket/${id}`}
      target="_blank"
      rel="noopener"
      title="Abrir el ticket PDF"
      className={className ?? "font-medium text-primary hover:text-brand-secondary hover:underline"}
    >
      {reference}
    </a>
  );
}

/** Customer phone that opens WhatsApp with the ticket link already written. */
export function WhatsappTicketLink({
  phone,
  booking,
}: {
  phone: string | null;
  booking: { id: string; reference: string; customerName: string; title: string; startsAt: string };
}) {
  if (!phone) return <>—</>;
  const href = whatsappTicketHref(
    phone,
    ticketWhatsappMessage({
      customerName: booking.customerName,
      reference: booking.reference,
      title: booking.title,
      when: `${formatDateLong(booking.startsAt)}, ${formatTime(booking.startsAt)}`,
      url: `${siteUrl()}/reservar/ticket?id=${booking.id}`,
    }),
  );
  if (!href) return <>{phone}</>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Enviar el ticket por WhatsApp"
      className="whitespace-nowrap text-brand-secondary hover:underline"
    >
      {phone} <span className="text-xs">· WhatsApp</span>
    </a>
  );
}
