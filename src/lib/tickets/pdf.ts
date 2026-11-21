import "server-only";
import {
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import QRCode from "qrcode";
import { siteUrl } from "@/lib/seo/site-url";
import { site } from "@/lib/site";
import { formatDateLong, formatTime } from "@/lib/tours/format";
import { checkinUrl, prettyCode } from "./codes";
import { maskDocument, type TicketBundle } from "./queries";

const NAVY = rgb(0, 0x38 / 255, 0x82 / 255);
const CYAN = rgb(0, 0x9f / 255, 0xe3 / 255);
const INK = rgb(0x0f / 255, 0x17 / 255, 0x20 / 255);
const GREY = rgb(0x54 / 255, 0x5e / 255, 0x67 / 255);
const LINE = rgb(0xe5 / 255, 0xea / 255, 0xee / 255);

const A4 = { w: 595.28, h: 841.89 };
const MARGIN = 40;
const TICKET_H = 236;
const GAP = 18;
const PER_PAGE = 3;

/** Drops characters the standard PDF fonts cannot draw (emoji, CJK…). */
function safe(font: PDFFont, text: string): string {
  const ok = new Set(font.getCharacterSet());
  return [...text.normalize("NFC")].filter((c) => ok.has(c.codePointAt(0)!)).join("");
}

function wrap(
  font: PDFFont,
  text: string,
  size: number,
  width: number,
  maxLines: number,
): string[] {
  const words = safe(font, text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width) line = next;
    else {
      if (line) lines.push(line);
      line = word;
    }
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

async function logo(pdf: PDFDocument): Promise<PDFImage | null> {
  try {
    const res = await fetch(`${siteUrl()}/brand/tripcelona-logo.png`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return await pdf.embedPng(await res.arrayBuffer());
  } catch {
    return null;
  }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** All the tickets of a booking (or cart) as one A4 PDF, three per page. */
export async function ticketsPdf(bundle: TicketBundle): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Billetes ${bundle.anchor.reference} · Tripcelona`);
  pdf.setAuthor("Tripcelona");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const brand = await logo(pdf);

  const tickets = bundle.trips.flatMap((trip) =>
    trip.rows
      .filter((r) => r.ticketCode)
      .map((r) => ({ trip, traveller: r, of: trip.rows.length })),
  );

  let page: PDFPage | null = null;
  for (const [i, t] of tickets.entries()) {
    if (i % PER_PAGE === 0) {
      page = pdf.addPage([A4.w, A4.h]);
      const note = safe(
        regular,
        `Enseña este billete en el móvil o impreso al subir al autobús. Dudas: ${site.phoneDisplay}`,
      );
      page.drawText(note, { x: MARGIN, y: 24, size: 8.5, font: regular, color: GREY });
    }
    const slot = i % PER_PAGE;
    const top = A4.h - MARGIN - slot * (TICKET_H + GAP);
    const x = MARGIN;
    const w = A4.w - MARGIN * 2;
    const y = top - TICKET_H;
    const p = page!;

    p.drawRectangle({ x, y, width: w, height: TICKET_H, borderColor: LINE, borderWidth: 1 });
    p.drawRectangle({ x, y: top - 6, width: w, height: 6, color: NAVY });

    // Stub on the right: QR + code, behind a perforation line.
    const stubW = 170;
    const stubX = x + w - stubW;
    for (let dy = y + 8; dy < top - 14; dy += 8)
      p.drawLine({
        start: { x: stubX, y: dy },
        end: { x: stubX, y: dy + 4 },
        thickness: 1,
        color: LINE,
      });
    const code = t.traveller.ticketCode!;
    const qr = await pdf.embedPng(
      await QRCode.toBuffer(checkinUrl(code), { margin: 1, width: 360, errorCorrectionLevel: "M" }),
    );
    const qrSize = 128;
    p.drawImage(qr, {
      x: stubX + (stubW - qrSize) / 2,
      y: top - 30 - qrSize,
      width: qrSize,
      height: qrSize,
    });
    const pretty = prettyCode(code);
    p.drawText(pretty, {
      x: stubX + (stubW - bold.widthOfTextAtSize(pretty, 13)) / 2,
      y: top - 52 - qrSize,
      size: 13,
      font: bold,
      color: INK,
    });
    const label = `Viajero ${t.traveller.position} de ${t.of}`;
    p.drawText(label, {
      x: stubX + (stubW - regular.widthOfTextAtSize(label, 9)) / 2,
      y: top - 68 - qrSize,
      size: 9,
      font: regular,
      color: GREY,
    });

    // Main part.
    const left = x + 20;
    const textW = stubX - left - 20;
    let cy = top - 34;
    if (brand) {
      const h = 26;
      const bw = (brand.width / brand.height) * h;
      p.drawImage(brand, { x: left, y: cy - h + 8, width: bw, height: h });
    } else {
      p.drawText("Tripcelona", { x: left, y: cy - 8, size: 16, font: bold, color: NAVY });
    }
    p.drawText("BILLETE", {
      x: stubX - 20 - bold.widthOfTextAtSize("BILLETE", 9),
      y: cy - 6,
      size: 9,
      font: bold,
      color: CYAN,
    });
    cy -= 40;
    for (const line of wrap(bold, t.trip.title, 15, textW, 2)) {
      p.drawText(line, { x: left, y: cy, size: 15, font: bold, color: INK });
      cy -= 19;
    }
    cy -= 4;
    const when =
      cap(formatDateLong(t.trip.startsAt)) +
      ` · salida ${formatTime(t.trip.startsAt)}` +
      (t.trip.endsAt ? ` · regreso aprox. ${formatTime(t.trip.endsAt)}` : "");
    const rows: [string, string][] = [
      ["Fecha", when],
      ["Punto de encuentro", t.trip.meetingPoint ?? site.meetingPoint],
      ["Viajero", t.traveller.name],
      ["Documento · Reserva", `${maskDocument(t.traveller.documentId)} · ${t.trip.reference}`],
    ];
    for (const [k, v] of rows) {
      p.drawText(safe(regular, k), { x: left, y: cy, size: 8.5, font: regular, color: GREY });
      cy -= 11;
      const size = k === "Viajero" ? 12 : 10;
      const font = k === "Viajero" ? bold : regular;
      for (const line of wrap(font, v, size, textW, 2)) {
        p.drawText(line, { x: left, y: cy, size, font, color: INK });
        cy -= size + 3;
      }
      cy -= 4;
      if (cy < y + 14) break;
    }
  }
  if (!tickets.length) pdf.addPage([A4.w, A4.h]);
  return pdf.save();
}

/** Inline SVG QR for the ticket page. */
export async function qrSvg(code: string): Promise<string> {
  return QRCode.toString(checkinUrl(code), { type: "svg", margin: 1, errorCorrectionLevel: "M" });
}
