import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import type { TicketBundle, TicketLine } from "@/lib/booking/passengers";
import { site } from "@/lib/site";
import { siteUrl } from "@/lib/seo/site-url";
import { checkinUrl } from "./codes";
import { formatDateLong, formatTime } from "@/lib/tours/format";

/*
 * The e-ticket as a PDF: one A4 page per trip, drawn as the same ticket the
 * site uses (photo-free header band, dashed perforation with notches, stub
 * with the details). Pure pdf-lib, so it runs in any serverless function.
 */

const NAVY = rgb(0, 0x38 / 255, 0x82 / 255);
const YELLOW = rgb(0xfc / 255, 0xb9 / 255, 0x2c / 255);
const INK = rgb(0x0f / 255, 0x17 / 255, 0x20 / 255);
const MUTED = rgb(0x54 / 255, 0x5e / 255, 0x67 / 255);
const LINE = rgb(0xd5 / 255, 0xdb / 255, 0xe1 / 255);
const PAGE_BG = rgb(0xf2 / 255, 0xf3 / 255, 0xf5 / 255);

const W = 595.28;
const H = 841.89;
const CARD_X = 48;
const CARD_W = W - CARD_X * 2;
const R = 18; // corner radius
const NOTCH = 12;

/** Standard PDF fonts are WinAnsi only: keep Latin-1 + common punctuation. */
export function pdfSafe(value: string): string {
  return value
    .normalize("NFC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7e\xa0-\xff€·]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, max: number): string[] {
  const words = pdfSafe(text).split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= max) current = next;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Rounded card with a half-circle notch on both sides at `notchY` (from top). */
function cardPath(height: number, notchY: number): string {
  const w = CARD_W;
  return [
    `M ${R} 0`,
    `H ${w - R}`,
    `A ${R} ${R} 0 0 1 ${w} ${R}`,
    `V ${notchY - NOTCH}`,
    `A ${NOTCH} ${NOTCH} 0 0 0 ${w} ${notchY + NOTCH}`,
    `V ${height - R}`,
    `A ${R} ${R} 0 0 1 ${w - R} ${height}`,
    `H ${R}`,
    `A ${R} ${R} 0 0 1 0 ${height - R}`,
    `V ${notchY + NOTCH}`,
    `A ${NOTCH} ${NOTCH} 0 0 0 0 ${notchY - NOTCH}`,
    `V ${R}`,
    `A ${R} ${R} 0 0 1 ${R} 0`,
    "Z",
  ].join(" ");
}

/** Top band only: rounded top corners, square bottom. */
function bandPath(height: number): string {
  const w = CARD_W;
  return `M ${R} 0 H ${w - R} A ${R} ${R} 0 0 1 ${w} ${R} V ${height} H 0 V ${R} A ${R} ${R} 0 0 1 ${R} 0 Z`;
}

/** The owner's logo, exactly as supplied: from disk, else from the site itself. */
async function logoBytes(): Promise<Uint8Array | null> {
  try {
    return await readFile(path.join(process.cwd(), "public/brand/tripcelona-logo.png"));
  } catch {
    try {
      const res = await fetch(`${siteUrl()}/brand/tripcelona-logo.png`);
      return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
    } catch {
      return null;
    }
  }
}

type Fonts = { regular: PDFFont; bold: PDFFont };

function label(page: PDFPage, fonts: Fonts, text: string, x: number, y: number) {
  page.drawText(pdfSafe(text.toUpperCase()), {
    x,
    y,
    size: 8,
    font: fonts.bold,
    color: MUTED,
  });
}

async function drawTicket(
  doc: PDFDocument,
  fonts: Fonts,
  logo: Awaited<ReturnType<PDFDocument["embedPng"]>> | null,
  bundle: TicketBundle,
  line: TicketLine,
  index: number,
) {
  const page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAGE_BG });

  const passengers = line.passengers.length
    ? line.passengers
    : Array.from({ length: line.travellers }, (_, i) => ({
        name: i === 0 ? bundle.booking.customerName : `Viajero ${i + 1}`,
        documentId: null,
      }));
  const twoCols = passengers.length > 8;
  const paxRows = twoCols ? Math.ceil(passengers.length / 2) : passengers.length;

  const titleLines = wrap(line.title, fonts.bold, 24, CARD_W - 64).slice(0, 3);
  const bandH = 96 + titleLines.length * 28;
  const notchY = bandH + 70;
  const cardH = notchY + 215 + paxRows * 30;
  const top = H - 56; // card top edge, PDF coordinates grow upwards
  const yOf = (fromTop: number) => top - fromTop;

  // Card + band (drawSvgPath draws with y flipped, from the given origin).
  page.drawSvgPath(cardPath(cardH, notchY), {
    x: CARD_X,
    y: top,
    color: rgb(1, 1, 1),
    borderColor: LINE,
    borderWidth: 0.8,
  });
  page.drawSvgPath(bandPath(bandH), { x: CARD_X, y: top, color: NAVY });

  // Band: logo chip, e-ticket pill, title, date.
  const pad = 32;
  if (logo) {
    const chipH = 44;
    const scale = (chipH - 10) / logo.height;
    const lw = logo.width * scale;
    page.drawRectangle({
      x: CARD_X + pad - 6,
      y: yOf(24 + chipH),
      width: lw + 12,
      height: chipH,
      color: rgb(1, 1, 1),
    });
    page.drawImage(logo, {
      x: CARD_X + pad,
      y: yOf(24 + chipH) + 5,
      width: lw,
      height: chipH - 10,
    });
  } else {
    page.drawText(site.name, {
      x: CARD_X + pad,
      y: yOf(52),
      size: 20,
      font: fonts.bold,
      color: rgb(1, 1, 1),
    });
  }
  const pill = "E-TICKET";
  const pillW = fonts.bold.widthOfTextAtSize(pill, 10) + 24;
  page.drawRectangle({
    x: CARD_X + CARD_W - pad - pillW,
    y: yOf(54),
    width: pillW,
    height: 22,
    color: YELLOW,
  });
  page.drawText(pill, {
    x: CARD_X + CARD_W - pad - pillW + 12,
    y: yOf(47),
    size: 10,
    font: fonts.bold,
    color: INK,
  });
  const count = bundle.lines.length;
  if (count > 1) {
    page.drawText(`${index + 1} / ${count}`, {
      x: CARD_X + CARD_W - pad - pillW,
      y: yOf(70),
      size: 9,
      font: fonts.regular,
      color: rgb(1, 1, 1),
    });
  }
  titleLines.forEach((t, i) =>
    page.drawText(t, {
      x: CARD_X + pad,
      y: yOf(100 + i * 28),
      size: 24,
      font: fonts.bold,
      color: rgb(1, 1, 1),
    }),
  );

  // Facts row, above the perforation.
  const factsTop = bandH + 28;
  const facts: [string, string][] = [
    ["Fecha", capital(formatDateLong(line.startsAt))],
    ["Salida", formatTime(line.startsAt)],
    ["Viajeros", String(line.travellers)],
  ];
  const colX = [CARD_X + pad, CARD_X + pad + 250, CARD_X + pad + 340];
  facts.forEach(([k, v], i) => {
    label(page, fonts, k, colX[i], yOf(factsTop));
    page.drawText(pdfSafe(v), {
      x: colX[i],
      y: yOf(factsTop + 18),
      size: i === 0 ? 12 : 14,
      font: fonts.bold,
      color: INK,
    });
  });

  // Perforation.
  for (let x = CARD_X + NOTCH + 10; x < CARD_X + CARD_W - NOTCH - 10; x += 10) {
    page.drawLine({
      start: { x, y: yOf(notchY) },
      end: { x: x + 5, y: yOf(notchY) },
      thickness: 1.4,
      color: LINE,
    });
  }

  // Stub: reference + meeting point (left), QR (right).
  const stubTop = notchY + 30;
  const qrSize = 112;
  const qrX = CARD_X + CARD_W - pad - qrSize;
  label(page, fonts, "Referencia", CARD_X + pad, yOf(stubTop));
  page.drawText(pdfSafe(line.reference), {
    x: CARD_X + pad,
    y: yOf(stubTop + 22),
    size: 20,
    font: fonts.bold,
    color: NAVY,
  });
  label(page, fonts, "Punto de encuentro", CARD_X + pad, yOf(stubTop + 50));
  const meeting = wrap(
    line.meetingPoint ?? site.meetingPoint,
    fonts.regular,
    11,
    qrX - CARD_X - pad - 20,
  ).slice(0, 4);
  meeting.forEach((m, i) =>
    page.drawText(m, {
      x: CARD_X + pad,
      y: yOf(stubTop + 66 + i * 15),
      size: 11,
      font: fonts.regular,
      color: INK,
    }),
  );

  // Staff scan it with the phone camera: opens the check-in page of this booking.
  const qr = await QRCode.toBuffer(checkinUrl(line.reference), {
    type: "png",
    margin: 0,
    width: 360,
    errorCorrectionLevel: "M",
    color: { dark: "#0f1720", light: "#ffffff" },
  });
  const qrImage = await doc.embedPng(qr);
  page.drawImage(qrImage, { x: qrX, y: yOf(stubTop - 6 + qrSize), width: qrSize, height: qrSize });

  // Passengers.
  const paxTop = stubTop + 150;
  page.drawLine({
    start: { x: CARD_X + pad, y: yOf(paxTop - 14) },
    end: { x: CARD_X + CARD_W - pad, y: yOf(paxTop - 14) },
    thickness: 0.8,
    color: LINE,
  });
  label(page, fonts, "Pasajeros", CARD_X + pad, yOf(paxTop + 4));
  const colW = twoCols ? (CARD_W - pad * 2) / 2 : CARD_W - pad * 2;
  passengers.forEach((p, i) => {
    const col = twoCols && i >= paxRows ? 1 : 0;
    const row = col ? i - paxRows : i;
    const x = CARD_X + pad + col * colW;
    const y = yOf(paxTop + 26 + row * 30);
    page.drawText(`${i + 1}.`, { x, y, size: 11, font: fonts.bold, color: MUTED });
    const name = wrap(p.name, fonts.bold, 11, colW - 30)[0] ?? "";
    page.drawText(name, { x: x + 20, y, size: 11, font: fonts.bold, color: INK });
    if (p.documentId) {
      page.drawText(pdfSafe(p.documentId), {
        x: x + 20,
        y: y - 12,
        size: 9,
        font: fonts.regular,
        color: MUTED,
      });
    }
  });

  // Footer note under the card.
  const note = [
    "Muestra este ticket en el móvil o impreso el día de la excursión.",
    `¿Dudas? ${site.phoneDisplay} · ${site.name}`,
  ];
  note.forEach((n, i) =>
    page.drawText(pdfSafe(n), {
      x: CARD_X + 8,
      y: yOf(cardH + 28 + i * 15),
      size: 10,
      font: fonts.regular,
      color: MUTED,
    }),
  );
}

/** One PDF with a ticket page per trip of the booking. */
export async function buildTicketPdf(bundle: TicketBundle): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Tripcelona e-ticket ${bundle.booking.reference}`);
  doc.setAuthor(site.name);
  doc.setCreator(site.name);
  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  const bytes = await logoBytes();
  const logo = bytes ? await doc.embedPng(bytes) : null;
  for (const [i, line] of bundle.lines.entries()) {
    await drawTicket(doc, fonts, logo, bundle, line, i);
  }
  return doc.save();
}
