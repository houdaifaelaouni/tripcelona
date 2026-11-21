import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { passengerListPdf, type PassengerRow } from "@/lib/admin/passenger-list-pdf";

const row = (i: number): PassengerRow => ({
  name: `Viajera número ${i} con un nombre bastante largo para recortar`,
  document: i % 2 ? "12345678Z" : null,
  phone: "+34 600 000 000",
  reference: `TC-${1000 + i}`,
  customer: "Núria Puig i Ferrer",
  pickup: i === 1 ? "Estació del Nord — andén 3" : null,
  boarded: i % 3 === 0,
});

describe("passenger list PDF", () => {
  it("draws a table that spills onto more pages when long", async () => {
    const bytes = await passengerListPdf({
      tourTitle: "La ruta del fuego: Fageda d’en Jordà",
      when: "sábado 6 de diciembre de 2026 · 08:00",
      capacity: 55,
      rows: Array.from({ length: 55 }, (_, i) => row(i + 1)),
      generatedAt: "21/11/26 17:00",
    });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThan(1);
    expect(doc.getPage(0).getWidth()).toBeGreaterThan(doc.getPage(0).getHeight());
  });

  it("renders an empty departure", async () => {
    const bytes = await passengerListPdf({
      tourTitle: "Rupit",
      when: "hoy",
      capacity: 10,
      rows: [],
      generatedAt: "-",
    });
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  });
});
