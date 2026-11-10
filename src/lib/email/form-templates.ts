import type { ContactInput, QuoteInput } from "@/lib/forms/schema";
import { esc, layout, rows, textRows, type EmailContent } from "./templates";

/**
 * Emails for the public forms (FR-41, FR-72). The auto-replies only confirm
 * receipt and repeat what the person sent; no promises beyond the live site's.
 */

const para = (s: string) => `<p>${esc(s).replace(/\n/g, "<br>")}</p>`;

function contactFacts(c: ContactInput): [string, string][] {
  return [
    ["Nombre", c.name],
    ["Email", c.email],
    ["Teléfono", c.phone ?? "—"],
    ["Novedades por email", c.newsletter ? "Sí" : "No"],
  ];
}

export function contactOwnerAlert(c: ContactInput): EmailContent {
  const subject = `Nuevo mensaje de contacto: ${c.name}`;
  return {
    subject,
    html: layout(
      subject,
      `<h1 style="font-size:20px;margin:0 0 12px">Nuevo mensaje desde la web</h1>${rows(contactFacts(c))}${para(c.message)}<p>Responde a este email para contestar directamente.</p>`,
    ),
    text: `${subject}\n\n${textRows(contactFacts(c))}\n\n${c.message}`,
  };
}

export function contactAutoReply(c: ContactInput): EmailContent {
  const subject = "Hemos recibido tu mensaje";
  return {
    subject,
    html: layout(
      subject,
      `<p>Hola ${esc(c.name)},</p><p>Gracias por escribirnos. Hemos recibido tu mensaje y te responderemos lo antes posible.</p><p style="color:#5b6474">Tu mensaje:</p>${para(c.message)}`,
    ),
    text: `Hola ${c.name},\n\nGracias por escribirnos. Hemos recibido tu mensaje y te responderemos lo antes posible.\n\nTu mensaje:\n${c.message}`,
  };
}

function quoteFacts(q: QuoteInput, tourLabel: string): [string, string][] {
  return [
    ["Plan", tourLabel],
    ["Fecha preferida", q.dates],
    ["Personas", String(q.groupSize)],
    ["Extras", q.extras.length ? q.extras.join("; ") : "—"],
    ["Presupuesto", q.budget ?? "—"],
    ["Nombre", q.name],
    ["Email", q.email],
    ["Teléfono / WhatsApp", q.phone],
    ["Empresa o grupo", q.company ?? "—"],
  ];
}

export function quoteOwnerAlert(q: QuoteInput, tourLabel: string, adminUrl: string): EmailContent {
  const subject = `Nueva solicitud de presupuesto: ${q.groupSize} personas, ${tourLabel}`;
  return {
    subject,
    html: layout(
      subject,
      `<h1 style="font-size:20px;margin:0 0 12px">Nueva solicitud de presupuesto</h1>${rows(quoteFacts(q, tourLabel))}${q.message ? para(q.message) : ""}<p><a href="${esc(adminUrl)}">Abrir en el panel</a></p>`,
    ),
    text: `${subject}\n\n${textRows(quoteFacts(q, tourLabel))}\n\n${q.message ?? ""}\n\n${adminUrl}`,
  };
}

export function quoteAutoReply(q: QuoteInput, tourLabel: string): EmailContent {
  const subject = "Hemos recibido tu solicitud de presupuesto";
  const intro =
    "Gracias por tu solicitud. Te enviaremos una propuesta personalizada en 24–48 horas.";
  return {
    subject,
    html: layout(
      subject,
      `<p>Hola ${esc(q.name)},</p><p>${esc(intro)}</p>${rows(quoteFacts(q, tourLabel).slice(0, 5))}`,
    ),
    text: `Hola ${q.name},\n\n${intro}\n\n${textRows(quoteFacts(q, tourLabel).slice(0, 5))}`,
  };
}
