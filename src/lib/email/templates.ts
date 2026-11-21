import { site } from "@/lib/site";
import { formatDateLong, formatPrice, formatTime } from "@/lib/tours/format";
import { prettyCode } from "@/lib/tickets/codes";
import type { TicketBundle } from "@/lib/tickets/queries";

/**
 * Transactional email content (US-21). Pure functions so they can be tested.
 * Only facts from the booking, tour and site config: no invented policies.
 * TODO(PO): sender address/branding (decision on branded email is pending).
 */
export type EmailBooking = {
  id: string;
  reference: string;
  customerName: string;
  email: string;
  phone: string | null;
  travellers: number;
  totalCents: number;
  pickupNote: string | null;
  departure: { startsAt: string; endsAt: string | null };
  tour: { slug: string; title: string; meetingPoint: string | null; packingList: string[] };
};

export type EmailContent = { subject: string; html: string; text: string };
export type EmailKind =
  | "confirmation"
  | "owner_alert"
  | "payment_failed"
  | "payment_request"
  | "cancellation"
  | "tickets";

export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function layout(title: string, body: string): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f2f3f5;font-family:Arial,Helvetica,sans-serif;color:#0f1720">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px">
<tr><td style="background:#003882;color:#ffffff;padding:18px 24px;font-size:20px;font-weight:bold;border-radius:12px 12px 0 0">${site.name}</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.5">${body}</td></tr>
<tr><td style="padding:16px 24px;font-size:13px;color:#545e67;border-top:1px solid #e5eaee">
¿Dudas? Llámanos al ${esc(site.phoneDisplay)} o escríbenos por WhatsApp: <a href="${site.whatsappHref}">${esc(site.phoneDisplay)}</a>
</td></tr></table></td></tr></table></body></html>`;
}

export function rows(items: [string, string][]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0">${items
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#545e67;width:40%;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;font-weight:bold">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

export function textRows(items: [string, string][]): string {
  return items.map(([k, v]) => `${k}: ${v}`).join("\n");
}

function tripFacts(b: EmailBooking): [string, string][] {
  const date = formatDateLong(b.departure.startsAt);
  const facts: [string, string][] = [
    ["Referencia", b.reference],
    ["Excursión", b.tour.title],
    ["Fecha", date.charAt(0).toUpperCase() + date.slice(1)],
    [
      "Salida",
      formatTime(b.departure.startsAt) +
        (b.departure.endsAt ? ` · regreso aprox. ${formatTime(b.departure.endsAt)}` : ""),
    ],
    ["Viajeros", String(b.travellers)],
    ["Total pagado", formatPrice(b.totalCents)],
  ];
  return facts;
}

export function confirmationEmail(
  b: EmailBooking,
  urls: { booking: string; calendar: string; tickets?: string },
) {
  const facts = tripFacts(b);
  const meeting = b.tour.meetingPoint ?? site.meetingPoint;
  const packing = b.tour.packingList;
  const html = layout(
    `Reserva confirmada ${b.reference}`,
    `<h1 style="font-size:22px;margin:0 0 8px">¡Reserva confirmada!</h1>
<p>Hola ${esc(b.customerName)}, hemos recibido tu pago. Estos son los datos de tu excursión:</p>
${rows(facts)}
<h2 style="font-size:17px;margin:20px 0 6px">Punto de encuentro</h2>
<p style="margin:0">${esc(meeting)}</p>
${
  packing.length
    ? `<h2 style="font-size:17px;margin:20px 0 6px">Qué llevar</h2><ul style="margin:0;padding-left:20px">${packing
        .map((p) => `<li>${esc(p)}</li>`)
        .join("")}</ul>`
    : ""
}
${
  urls.tickets
    ? `<div style="margin:24px 0 0;padding:16px;border-radius:10px;background:#e8f6fd">
<p style="margin:0 0 6px;font-weight:bold">Último paso: tus billetes</p>
<p style="margin:0 0 12px">Rellena el nombre y el documento de cada viajero y te enviamos los billetes con código QR para enseñar al subir al autobús.</p>
<a href="${urls.tickets}" style="background:#003882;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Completar viajeros</a></div>`
    : ""
}
<p style="margin:24px 0 8px"><a href="${urls.booking}" style="background:#003882;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Ver mi reserva</a></p>
<p style="margin:0"><a href="${urls.calendar}">Añadir al calendario</a></p>`,
  );
  const text = [
    `¡Reserva confirmada!`,
    ``,
    `Hola ${b.customerName}, hemos recibido tu pago.`,
    ``,
    textRows(facts),
    ``,
    `Punto de encuentro: ${meeting}`,
    ...(packing.length ? [``, `Qué llevar:`, ...packing.map((p) => `- ${p}`)] : []),
    ``,
    ...(urls.tickets ? [`Completa los viajeros y recibe tus billetes: ${urls.tickets}`, ``] : []),
    `Ver mi reserva: ${urls.booking}`,
    `Añadir al calendario: ${urls.calendar}`,
    ``,
    `Dudas: ${site.phoneDisplay} (teléfono y WhatsApp)`,
  ].join("\n");
  return { subject: `Reserva confirmada ${b.reference}: ${b.tour.title}`, html, text };
}

export function ownerAlertEmail(b: EmailBooking, note?: string): EmailContent {
  const facts: [string, string][] = [
    ...tripFacts(b),
    ["Cliente", b.customerName],
    ["Email", b.email],
    ["Teléfono", b.phone ?? "—"],
    ["Comentarios", b.pickupNote || "—"],
  ];
  const heading = note ?? "Nueva reserva pagada";
  return {
    subject: `${heading}: ${b.reference} · ${b.tour.title} · ${b.travellers} pax`,
    html: layout(heading, `<h1 style="font-size:20px;margin:0">${esc(heading)}</h1>${rows(facts)}`),
    text: `${heading}\n\n${textRows(facts)}`,
  };
}

export function paymentFailedEmail(b: EmailBooking, retryUrl: string): EmailContent {
  const facts: [string, string][] = [
    ["Referencia", b.reference],
    ["Excursión", b.tour.title],
    ["Viajeros", String(b.travellers)],
    ["Total", formatPrice(b.totalCents)],
  ];
  return {
    subject: `No hemos podido cobrar tu reserva ${b.reference}`,
    html: layout(
      "Pago no completado",
      `<h1 style="font-size:22px;margin:0 0 8px">Tu pago no se ha completado</h1>
<p>Hola ${esc(b.customerName)}, el banco no ha autorizado el pago de tu reserva, así que todavía no está confirmada.</p>
${rows(facts)}
<p>Puedes intentarlo de nuevo con otra tarjeta mientras queden plazas:</p>
<p><a href="${retryUrl}" style="background:#003882;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Reintentar el pago</a></p>`,
    ),
    text: `Tu pago no se ha completado.\n\nHola ${b.customerName}, el banco no ha autorizado el pago de tu reserva, así que todavía no está confirmada.\n\n${textRows(facts)}\n\nReintentar el pago: ${retryUrl}`,
  };
}

export function cancellationEmail(
  b: EmailBooking,
  refunded: boolean,
  scope: "departure" | "booking" = "departure",
): EmailContent {
  const facts: [string, string][] = [
    ["Referencia", b.reference],
    ["Excursión", b.tour.title],
    ["Fecha", formatDateLong(b.departure.startsAt)],
    ...(refunded ? ([["Importe devuelto", formatPrice(b.totalCents)]] as [string, string][]) : []),
  ];
  const refundLine = refunded
    ? "Te hemos devuelto el importe íntegro a la tarjeta con la que pagaste. El banco puede tardar unos días en mostrarlo."
    : "Nos pondremos en contacto contigo para gestionar la devolución.";
  const departure = scope === "departure";
  const title = departure ? "Salida cancelada" : "Reserva cancelada";
  const heading = departure ? "Hemos cancelado esta salida" : "Tu reserva está cancelada";
  const intro = departure
    ? "sentimos comunicarte que la salida de tu reserva se ha cancelado."
    : "te confirmamos que tu reserva se ha cancelado.";
  return {
    subject: `${title}: ${b.tour.title} (${b.reference})`,
    html: layout(
      title,
      `<h1 style="font-size:22px;margin:0 0 8px">${heading}</h1>
<p>Hola ${esc(b.customerName)}, ${intro}</p>
${rows(facts)}
<p>${esc(refundLine)}</p>`,
    ),
    text: `${heading}.\n\nHola ${b.customerName}, ${intro}\n\n${textRows(facts)}\n\n${refundLine}`,
  };
}

export function paymentRequestEmail(b: EmailBooking, payUrl: string): EmailContent {
  const date = formatDateLong(b.departure.startsAt);
  const facts: [string, string][] = [
    ["Referencia", b.reference],
    ["Excursión", b.tour.title],
    ["Fecha", date.charAt(0).toUpperCase() + date.slice(1)],
    ["Viajeros", String(b.travellers)],
    ["Total", formatPrice(b.totalCents)],
  ];
  return {
    subject: `Completa el pago de tu reserva ${b.reference}`,
    html: layout(
      "Pago pendiente",
      `<h1 style="font-size:22px;margin:0 0 8px">Te hemos guardado las plazas</h1>
<p>Hola ${esc(b.customerName)}, para confirmar tu reserva solo falta el pago con tarjeta:</p>
${rows(facts)}
<p><a href="${payUrl}" style="background:#003882;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Pagar la reserva</a></p>`,
    ),
    text: `Te hemos guardado las plazas.\n\nHola ${b.customerName}, para confirmar tu reserva solo falta el pago con tarjeta.\n\n${textRows(facts)}\n\nPagar la reserva: ${payUrl}`,
  };
}

/** The e-tickets, sent when the traveller form is saved (PDF attached). */
export function ticketsEmail(bundle: TicketBundle, url: string): EmailContent {
  const b = bundle.anchor;
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  const blocks = bundle.trips.map((trip) => {
    const when = `${cap(formatDateLong(trip.startsAt))} · ${formatTime(trip.startsAt)}`;
    const meeting = trip.meetingPoint ?? site.meetingPoint;
    const list = trip.rows
      .map(
        (r) =>
          `<tr><td style="padding:6px 0">${esc(r.name)}</td><td style="padding:6px 0;font-family:monospace;font-weight:bold;text-align:right">${esc(prettyCode(r.ticketCode ?? ""))}</td></tr>`,
      )
      .join("");
    return {
      html: `<h2 style="font-size:17px;margin:20px 0 4px">${esc(trip.title)}</h2>
<p style="margin:0;color:#545e67">${esc(when)} · ${esc(meeting)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:8px 0;border-top:1px solid #e5eaee">${list}</table>`,
      text: [
        trip.title,
        `${when} · ${meeting}`,
        ...trip.rows.map((r) => `- ${r.name}: ${prettyCode(r.ticketCode ?? "")}`),
      ].join("\n"),
    };
  });
  const html = layout(
    `Tus billetes ${b.reference}`,
    `<h1 style="font-size:22px;margin:0 0 8px">Tus billetes están listos</h1>
<p>Hola ${esc(b.customerName)}, aquí tienes los billetes de tu reserva <strong>${esc(b.reference)}</strong>. Van adjuntos en PDF, uno por viajero, con su código QR.</p>
${blocks.map((x) => x.html).join("")}
<p style="margin:16px 0 0">El día de la excursión, enseña el QR en el móvil o impreso al subir al autobús.</p>
<p style="margin:24px 0 8px"><a href="${url}" style="background:#003882;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Ver mis billetes</a></p>`,
  );
  const text = [
    `Tus billetes están listos (${b.reference})`,
    ``,
    `Hola ${b.customerName}, van adjuntos en PDF, uno por viajero, con su código QR.`,
    ``,
    ...blocks.flatMap((x) => [x.text, ``]),
    `Enseña el QR en el móvil o impreso al subir al autobús.`,
    `Ver mis billetes: ${url}`,
    ``,
    `Dudas: ${site.phoneDisplay}`,
  ].join("\n");
  return { subject: `Tus billetes ${b.reference} · Tripcelona`, html, text };
}
