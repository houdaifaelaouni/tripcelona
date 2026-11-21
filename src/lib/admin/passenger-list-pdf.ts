import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { pdfSafe } from "@/lib/tickets/pdf";

/*
 * Passenger list of one departure as a printable PDF table (A4 landscape):
 * one row per traveller, with an empty box to tick on the bus when nobody
 * checked them in with the QR yet.
 */

export type PassengerRow = {
  name: string;
  document: string | null;
  phone: string | null;
  reference: string;
  customer: string;
  pickup: string | null;
  boarded: boolean;
};

export type PassengerListInput = {
  tourTitle: string;
  /** Already formatted for Madrid, e.g. "sábado 6 de diciembre de 2026 · 08:00". */
  when: string;
  capacity: number;
  rows: PassengerRow[];
  generatedAt: string;
};

const W = 841.89;
const H = 595.28;
const M = 36;
const INK = rgb(0x0f / 255, 0x17 / 255, 0x20 / 255);
const MUTED = rgb(0x54 / 255, 0x5e / 255, 0x67 / 255);
const LINE = rgb(0xd5 / 255, 0xdb / 255, 0xe1 / 255);
const HEAD_BG = rgb(0, 0x38 / 255, 0x82 / 255);
const ZEBRA = rgb(0xf4 / 255, 0xf6 / 255, 0xf8 / 255);

const COLS: { label: string; width: number; key: keyof PassengerRow | "n" }[] = [
  { label: "#", width: 26, key: "n" },
  { label: "Pasajero", width: 170, key: "name" },
  { label: "Documento", width: 92, key: "document" },
  { label: "Teléfono", width: 96, key: "phone" },
  { label: "Referencia", width: 78, key: "reference" },
  { label: "Reserva de", width: 140, key: "customer" },
  { label: "Recogida / notas", width: 115, key: "pickup" },
  { label: "Embarcado", width: 53, key: "boarded" },
];
const ROW_H = 20;
const SIZE = 9;

function fit(text: string, font: PDFFont, size: number, max: number): string {
  let t = pdfSafe(text);
  if (font.widthOfTextAtSize(t, size) <= max) return t;
  while (t.length > 1 && font.widthOfTextAtSize(`${t}...`, size) > max) t = t.slice(0, -1);
  return `${t}...`;
}

export async function passengerListPdf(input: PassengerListInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(pdfSafe(`Pasajeros - ${input.tourTitle}`));
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const tableW = COLS.reduce((s, c) => s + c.width, 0);

  let page: PDFPage = doc.addPage([W, H]);
  let y = 0;
  let pageNo = 0;

  const header = () => {
    pageNo += 1;
    y = H - M;
    page.drawText(fit(input.tourTitle, bold, 16, W - 2 * M), {
      x: M,
      y: y - 14,
      size: 16,
      font: bold,
      color: INK,
    });
    y -= 32;
    const boarded = input.rows.filter((r) => r.boarded).length;
    page.drawText(
      pdfSafe(
        `${input.when}  ·  ${input.rows.length} pasajeros de ${input.capacity} plazas  ·  ${boarded} embarcados`,
      ),
      { x: M, y, size: 10, font, color: MUTED },
    );
    y -= 18;
    page.drawRectangle({ x: M, y: y - ROW_H + 6, width: tableW, height: ROW_H, color: HEAD_BG });
    let x = M;
    for (const c of COLS) {
      page.drawText(pdfSafe(c.label), {
        x: x + 4,
        y: y - 8,
        size: SIZE,
        font: bold,
        color: rgb(1, 1, 1),
      });
      x += c.width;
    }
    y -= ROW_H;
  };
  const footer = () =>
    page.drawText(pdfSafe(`Tripcelona · generado ${input.generatedAt} · página ${pageNo}`), {
      x: M,
      y: M / 2,
      size: 8,
      font,
      color: MUTED,
    });

  header();
  if (input.rows.length === 0) {
    page.drawText("Todavía no hay reservas pagadas en esta salida.", {
      x: M + 4,
      y: y - 8,
      size: 10,
      font,
      color: MUTED,
    });
  }
  input.rows.forEach((r, i) => {
    if (y - ROW_H < M) {
      footer();
      page = doc.addPage([W, H]);
      header();
    }
    if (i % 2 === 1)
      page.drawRectangle({ x: M, y: y - ROW_H + 6, width: tableW, height: ROW_H, color: ZEBRA });
    let x = M;
    for (const c of COLS) {
      const inner = c.width - 8;
      if (c.key === "boarded") {
        const bx = x + c.width / 2 - 5;
        page.drawRectangle({
          x: bx,
          y: y - 10,
          width: 10,
          height: 10,
          borderColor: MUTED,
          borderWidth: 0.8,
        });
        if (r.boarded)
          page.drawText("X", { x: bx + 2, y: y - 8.5, size: 9, font: bold, color: INK });
      } else {
        const raw = c.key === "n" ? String(i + 1) : ((r[c.key] as string | null) ?? "");
        page.drawText(fit(raw || "-", c.key === "name" ? bold : font, SIZE, inner), {
          x: x + 4,
          y: y - 8,
          size: SIZE,
          font: c.key === "name" ? bold : font,
          color: raw ? INK : MUTED,
        });
      }
      x += c.width;
    }
    page.drawLine({
      start: { x: M, y: y - ROW_H + 6 },
      end: { x: M + tableW, y: y - ROW_H + 6 },
      thickness: 0.5,
      color: LINE,
    });
    y -= ROW_H;
  });
  footer();
  return doc.save();
}
