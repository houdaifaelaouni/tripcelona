import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import type { TicketBundle, TicketLine } from "@/lib/booking/passengers";
import { shownPassengers } from "./display";
import { site } from "@/lib/site";
import { siteUrl } from "@/lib/seo/site-url";
import { checkinUrl } from "./codes";
import { formatTime } from "@/lib/tours/format";

/*
 * The e-ticket as a PDF, laid out like an airline boarding pass: a navy band,
 * the route (Barcelona to the trip), passenger, email, reference, date,
 * boarding and departure times, and a tear-off stub with the check-in QR. A
 * second card holds the meeting point, the passenger list and what to know.
 * One A4 page per trip. Pure pdf-lib, so it runs in any serverless function.
 */

const NAVY = rgb(0, 0x38 / 255, 0x82 / 255);
const YELLOW = rgb(0xfc / 255, 0xb9 / 255, 0x2c / 255);
const INK = rgb(0x0f / 255, 0x17 / 255, 0x20 / 255);
const MUTED = rgb(0x54 / 255, 0x5e / 255, 0x67 / 255);
const LINE = rgb(0xd5 / 255, 0xdb / 255, 0xe1 / 255);
const PAGE_BG = rgb(0xf2 / 255, 0xf3 / 255, 0xf5 / 255);
const SOFT = rgb(0xf3 / 255, 0xf6 / 255, 0xfb / 255);
const WHITE = rgb(1, 1, 1);

const W = 595.28;
const H = 841.89;
const CARD_X = 40;
const CARD_W = W - CARD_X * 2;
const R = 16; // corner radius
const NOTCH = 11;
const STUB = 150; // width of the tear-off stub
const PASS_H = 350;
const BAND = 64;
const PAD = 24;
const BOARDING_MINUTES = 15;
const TZ = "Europe/Madrid";

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

/** Shrinks text until it fits, then cuts it with "...". */
function fit(text: string, font: PDFFont, size: number, max: number, min = 8) {
  let t = pdfSafe(text);
  let s = size;
  while (s > min && font.widthOfTextAtSize(t, s) > max) s -= 0.5;
  while (t.length > 4 && font.widthOfTextAtSize(t, s) > max) t = `${t.slice(0, -4)}...`;
  return { text: t, size: s };
}

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  })
    .format(new Date(iso))
    .replace(/\./g, "")
    .replace(/,/g, "")
    .toUpperCase();

/** Rounded card with half-circle notches top and bottom at `perfX` (the tear line). */
function passPath(height: number, perfX: number): string {
  const w = CARD_W;
  return [
    `M ${R} 0`,
    `H ${perfX - NOTCH}`,
    `A ${NOTCH} ${NOTCH} 0 0 0 ${perfX + NOTCH} 0`,
    `H ${w - R}`,
    `A ${R} ${R} 0 0 1 ${w} ${R}`,
    `V ${height - R}`,
    `A ${R} ${R} 0 0 1 ${w - R} ${height}`,
    `H ${perfX + NOTCH}`,
    `A ${NOTCH} ${NOTCH} 0 0 0 ${perfX - NOTCH} ${height}`,
    `H ${R}`,
    `A ${R} ${R} 0 0 1 0 ${height - R}`,
    `V ${R}`,
    `A ${R} ${R} 0 0 1 ${R} 0`,
    "Z",
  ].join(" ");
}

/** Main band: rounded top-left corner, ends at the notch. */
function mainBandPath(perfX: number): string {
  return `M ${R} 0 H ${perfX - NOTCH} A ${NOTCH} ${NOTCH} 0 0 0 ${perfX} ${NOTCH} V ${BAND} H 0 V ${R} A ${R} ${R} 0 0 1 ${R} 0 Z`;
}

/** Stub band: starts after the notch, rounded top-right corner. */
function stubBandPath(): string {
  const w = STUB;
  return `M 0 ${NOTCH} A ${NOTCH} ${NOTCH} 0 0 0 ${NOTCH} 0 H ${w - R} A ${R} ${R} 0 0 1 ${w} ${R} V ${BAND} H 0 Z`;
}

function boxPath(width: number, height: number, r = R): string {
  return `M ${r} 0 H ${width - r} A ${r} ${r} 0 0 1 ${width} ${r} V ${height - r} A ${r} ${r} 0 0 1 ${width - r} ${height} H ${r} A ${r} ${r} 0 0 1 0 ${height - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
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
  page.drawText(pdfSafe(text.toUpperCase()), { x, y, size: 7.5, font: fonts.bold, color: MUTED });
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
  const top = H - 40; // PDF coordinates grow upwards: measure from the top
  const yOf = (fromTop: number) => top - fromTop;
  const perfX = CARD_W - STUB;
  const left = CARD_X + PAD;
  const mainW = perfX - PAD * 2;
  const stubX = CARD_X + perfX + 18;
  const stubW = STUB - 36;

  const passengers = shownPassengers(line, bundle.booking.customerName);
  const holder = passengers[0]?.name ?? bundle.booking.customerName;
  const boarding = new Date(Date.parse(line.startsAt) - BOARDING_MINUTES * 60_000).toISOString();

  // ---- Boarding pass ----
  page.drawSvgPath(passPath(PASS_H, perfX), {
    x: CARD_X,
    y: top,
    color: WHITE,
    borderColor: LINE,
    borderWidth: 0.8,
  });
  page.drawSvgPath(mainBandPath(perfX), { x: CARD_X, y: top, color: NAVY });
  page.drawSvgPath(stubBandPath(), { x: CARD_X + perfX, y: top, color: YELLOW });

  // Band: logo chip left, "Tarjeta de embarque" right; stub says E-TICKET.
  if (logo) {
    const chipH = 40;
    const scale = (chipH - 12) / logo.height;
    const lw = logo.width * scale;
    page.drawSvgPath(boxPath(lw + 18, chipH, 8), { x: left - 4, y: yOf(12), color: WHITE });
    page.drawImage(logo, { x: left + 5, y: yOf(12 + chipH) + 6, width: lw, height: chipH - 12 });
  } else {
    page.drawText(site.name, { x: left, y: yOf(40), size: 20, font: fonts.bold, color: WHITE });
  }
  const t1 = "TARJETA DE EMBARQUE";
  const t2 = `BOARDING PASS${bundle.lines.length > 1 ? `  ·  ${index + 1}/${bundle.lines.length}` : ""}`;
  const rightEdge = CARD_X + perfX - PAD;
  page.drawText(t1, {
    x: rightEdge - fonts.bold.widthOfTextAtSize(t1, 12),
    y: yOf(31),
    size: 12,
    font: fonts.bold,
    color: WHITE,
  });
  page.drawText(pdfSafe(t2), {
    x: rightEdge - fonts.regular.widthOfTextAtSize(pdfSafe(t2), 8.5),
    y: yOf(45),
    size: 8.5,
    font: fonts.regular,
    color: WHITE,
  });
  page.drawText("E-TICKET", { x: stubX, y: yOf(31), size: 12, font: fonts.bold, color: INK });
  page.drawText(pdfSafe(site.name), {
    x: stubX,
    y: yOf(45),
    size: 8.5,
    font: fonts.regular,
    color: INK,
  });

  // Route: BCN (Barcelona) - - -> the trip.
  const routeTop = BAND + 28;
  label(page, fonts, "Desde", left, yOf(routeTop));
  page.drawText("BCN", {
    x: left,
    y: yOf(routeTop + 36),
    size: 34,
    font: fonts.bold,
    color: NAVY,
  });
  page.drawText("Barcelona", {
    x: left,
    y: yOf(routeTop + 52),
    size: 10,
    font: fonts.regular,
    color: MUTED,
  });
  const lineX1 = left + 88;
  const lineX2 = left + 140;
  const lineY = yOf(routeTop + 24);
  page.drawCircle({ x: lineX1, y: lineY, size: 3, color: NAVY });
  for (let x = lineX1 + 7; x < lineX2 - 10; x += 7) {
    page.drawLine({
      start: { x, y: lineY },
      end: { x: x + 3.5, y: lineY },
      thickness: 1.4,
      color: NAVY,
    });
  }
  page.drawSvgPath("M 0 -5 L 9 0 L 0 5 Z", { x: lineX2 - 9, y: lineY, color: NAVY });
  const destX = left + 156;
  const destW = left + mainW - destX;
  label(page, fonts, "Hasta", destX, yOf(routeTop));
  wrap(line.title, fonts.bold, 13, destW)
    .slice(0, 3)
    .forEach((t, i) =>
      page.drawText(t, {
        x: destX,
        y: yOf(routeTop + 19 + i * 16),
        size: 13,
        font: fonts.bold,
        color: INK,
      }),
    );

  // Fields grid.
  const gridTop = routeTop + 92;
  page.drawLine({
    start: { x: left, y: yOf(gridTop - 16) },
    end: { x: left + mainW, y: yOf(gridTop - 16) },
    thickness: 0.8,
    color: LINE,
  });
  // Columns: wide first one (name, date, email), then two narrow ones.
  const colX = [0, 0.44, 0.72].map((f) => left + f * mainW);
  const colEnd = [...colX.slice(1), left + mainW];
  const field = (k: string, v: string, c: number, row: number, span = 1, accent = false) => {
    const x = colX[c];
    const y = gridTop + row * 44;
    label(page, fonts, k, x, yOf(y));
    const f = fit(v, fonts.bold, accent ? 15 : 12, colEnd[c + span - 1] - x - 10);
    page.drawText(f.text, {
      x,
      y: yOf(y + 18),
      size: f.size,
      font: fonts.bold,
      color: accent ? NAVY : INK,
    });
  };
  field("Pasajero", holder, 0, 0, 2);
  field("Referencia", line.reference, 2, 0, 1, true);
  field("Fecha", shortDate(line.startsAt), 0, 1);
  field("Embarque", formatTime(boarding), 1, 1, 1, true);
  field("Salida", formatTime(line.startsAt), 2, 1, 1, true);
  field("Email", bundle.booking.email, 0, 2, 2);
  field("Viajeros", String(line.travellers), 2, 2);
  const back = line.endsAt ? `Regreso aprox. ${formatTime(line.endsAt)}  ·  ` : "";
  page.drawText(pdfSafe(`${back}Embarque ${BOARDING_MINUTES} min antes de la salida`), {
    x: left,
    y: yOf(PASS_H - 20),
    size: 8.5,
    font: fonts.regular,
    color: MUTED,
  });

  // Tear line.
  for (let y = BAND + 10; y < PASS_H - NOTCH - 6; y += 9) {
    page.drawLine({
      start: { x: CARD_X + perfX, y: yOf(y) },
      end: { x: CARD_X + perfX, y: yOf(y + 4.5) },
      thickness: 1.2,
      color: LINE,
    });
  }

  // Stub: passenger, QR, reference, date and time.
  label(page, fonts, "Pasajero", stubX, yOf(BAND + 26));
  const sn = fit(holder, fonts.bold, 11, stubW);
  page.drawText(sn.text, {
    x: stubX,
    y: yOf(BAND + 42),
    size: sn.size,
    font: fonts.bold,
    color: INK,
  });
  // Staff scan it with the phone camera: opens the check-in page of this booking.
  const qr = await QRCode.toBuffer(checkinUrl(line.reference), {
    type: "png",
    margin: 0,
    width: 360,
    errorCorrectionLevel: "M",
    color: { dark: "#0f1720", light: "#ffffff" },
  });
  const qrImage = await doc.embedPng(qr);
  const qrTop = BAND + 58;
  page.drawImage(qrImage, { x: stubX, y: yOf(qrTop + stubW), width: stubW, height: stubW });
  const ref = fit(line.reference, fonts.bold, 13, stubW);
  page.drawText(ref.text, {
    x: stubX,
    y: yOf(qrTop + stubW + 22),
    size: ref.size,
    font: fonts.bold,
    color: NAVY,
  });
  page.drawText(pdfSafe(shortDate(line.startsAt)), {
    x: stubX,
    y: yOf(qrTop + stubW + 38),
    size: 8.5,
    font: fonts.regular,
    color: MUTED,
  });
  page.drawText(pdfSafe(`Salida ${formatTime(line.startsAt)}`), {
    x: stubX,
    y: yOf(qrTop + stubW + 52),
    size: 8.5,
    font: fonts.bold,
    color: INK,
  });

  // ---- Details: meeting point, passengers, what to know ----
  const innerW = CARD_W - PAD * 2;
  const twoCols = passengers.length > 6;
  const paxRows = twoCols ? Math.ceil(passengers.length / 2) : passengers.length;
  const meeting = wrap(
    line.meetingPoint ?? site.meetingPoint,
    fonts.regular,
    11,
    innerW - 28,
  ).slice(0, 4);
  const tips = [
    `Llega al punto de encuentro ${BOARDING_MINUTES} minutos antes de la salida.`,
    "Muestra el código QR al guía o al conductor al subir.",
    "Lleva tu documento de identidad (DNI, NIE o pasaporte).",
  ];
  const detTop = PASS_H + 18;
  const meetH = 44 + meeting.length * 15;
  const paxH = 40 + paxRows * 20;
  const tipsH = 34 + tips.length * 16;
  const detH = 22 + meetH + paxH + tipsH;
  page.drawSvgPath(boxPath(CARD_W, detH), {
    x: CARD_X,
    y: yOf(detTop),
    color: WHITE,
    borderColor: LINE,
    borderWidth: 0.8,
  });

  let y = detTop + 22;
  page.drawSvgPath(boxPath(innerW, meetH - 12, 10), { x: left, y: yOf(y), color: SOFT });
  page.drawRectangle({
    x: left,
    y: yOf(y + meetH - 22),
    width: 3,
    height: meetH - 32,
    color: NAVY,
  });
  label(page, fonts, "Punto de encuentro", left + 14, yOf(y + 18));
  meeting.forEach((m, i) =>
    page.drawText(m, {
      x: left + 14,
      y: yOf(y + 35 + i * 15),
      size: 11,
      font: fonts.regular,
      color: INK,
    }),
  );

  y += meetH;
  label(page, fonts, `Pasajeros (${passengers.length})`, left, yOf(y + 10));
  const paxColW = twoCols ? innerW / 2 : innerW;
  passengers.forEach((p, i) => {
    const c = twoCols && i >= paxRows ? 1 : 0;
    const row = c ? i - paxRows : i;
    const x = left + c * paxColW;
    const py = yOf(y + 32 + row * 20);
    page.drawText(String(i + 1).padStart(2, "0"), {
      x,
      y: py,
      size: 10,
      font: fonts.bold,
      color: MUTED,
    });
    const name = fit(p.name, fonts.bold, 11, paxColW - 140);
    page.drawText(name.text, { x: x + 22, y: py, size: name.size, font: fonts.bold, color: INK });
    if (p.documentId) {
      const idX = x + 22 + fonts.bold.widthOfTextAtSize(name.text, name.size) + 10;
      page.drawText(pdfSafe(p.documentId), {
        x: idX,
        y: py,
        size: 9.5,
        font: fonts.regular,
        color: MUTED,
      });
    }
  });

  y += paxH;
  page.drawLine({
    start: { x: left, y: yOf(y - 8) },
    end: { x: left + innerW, y: yOf(y - 8) },
    thickness: 0.8,
    color: LINE,
  });
  label(page, fonts, "Antes de salir", left, yOf(y + 12));
  tips.forEach((t, i) => {
    const ty = yOf(y + 30 + i * 16);
    page.drawCircle({ x: left + 3, y: ty + 3.5, size: 2.4, color: YELLOW });
    page.drawText(pdfSafe(t), { x: left + 12, y: ty, size: 10, font: fonts.regular, color: INK });
  });

  // Footer under the cards.
  const host = siteUrl().replace(/^https?:\/\//, "");
  page.drawText(pdfSafe(`¿Dudas? ${site.phoneDisplay}  ·  ${host}`), {
    x: CARD_X + 8,
    y: yOf(detTop + detH + 24),
    size: 9.5,
    font: fonts.regular,
    color: MUTED,
  });
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
