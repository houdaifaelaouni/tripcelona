import type { Passenger, TicketLine } from "@/lib/booking/passengers";

/**
 * The names printed on a ticket: the saved passengers, or until the customer
 * names them, the buyer plus "Viajero 2…n", so a ticket exists from payment on.
 */
export function shownPassengers(line: TicketLine, customerName: string): Passenger[] {
  if (line.passengers.length) return line.passengers;
  return Array.from({ length: line.travellers }, (_, i) => ({
    name: i === 0 ? customerName : `Viajero ${i + 1}`,
    documentId: null,
  }));
}

/**
 * wa.me link that opens WhatsApp on the customer's number with the ticket
 * link already typed. Spanish numbers without a country code get +34.
 */
export function whatsappTicketHref(phone: string | null, message: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (/^[6789]\d{8}$/.test(digits)) digits = `34${digits}`;
  digits = digits.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function ticketWhatsappMessage(b: {
  customerName: string;
  reference: string;
  title: string;
  when: string;
  url: string;
}): string {
  const first = b.customerName.split(" ")[0];
  return [
    `Hola ${first}, aquí tienes tu ticket de Tripcelona para "${b.title}" (${b.when}).`,
    `Referencia: ${b.reference}`,
    `Descárgalo aquí: ${b.url}`,
    `¡Nos vemos en la excursión!`,
  ].join("\n");
}
