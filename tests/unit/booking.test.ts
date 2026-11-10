import { describe, expect, it } from "vitest";
import { checkoutSchema, fieldErrors, MAX_TRAVELLERS } from "@/lib/booking/schema";
import { quoteDeparture, type QuotableDeparture } from "@/lib/booking/quote";

const NOW = Date.parse("2026-11-10T10:00:00Z");
const departure: QuotableDeparture = {
  priceCents: 4500,
  capacity: 50,
  seatsTaken: 46,
  status: "open",
  startsAt: "2026-12-01T07:00:00Z",
  tourPublished: true,
};

const valid = {
  departureId: "4f6c1e9a-3b2d-4c8e-9f1a-2b3c4d5e6f70",
  travellers: "2",
  name: "Ana García",
  email: "ana@example.com",
  phone: "+34 600 000 000",
  pickupNote: "",
  terms: "on",
  company: "",
};

describe("quoteDeparture", () => {
  it("prices from the stored departure only", () => {
    expect(quoteDeparture(departure, 3, NOW)).toEqual({
      ok: true,
      unitCents: 4500,
      travellers: 3,
      totalCents: 13500,
      seatsLeft: 4,
    });
  });

  it("rejects groups larger than the seats left", () => {
    expect(quoteDeparture(departure, 5, NOW)).toMatchObject({
      ok: false,
      reason: "not_enough_seats",
      seatsLeft: 4,
    });
  });

  it("treats a full or sold-out departure as sold out", () => {
    expect(quoteDeparture({ ...departure, seatsTaken: 50 }, 1, NOW).ok).toBe(false);
    expect(quoteDeparture({ ...departure, status: "sold_out" }, 1, NOW)).toMatchObject({
      reason: "sold_out",
    });
  });

  it("refuses past, cancelled and unpublished departures", () => {
    expect(
      quoteDeparture({ ...departure, startsAt: "2026-11-08T07:00:00Z" }, 1, NOW),
    ).toMatchObject({ reason: "past" });
    expect(quoteDeparture({ ...departure, status: "cancelled" }, 1, NOW)).toMatchObject({
      reason: "not_bookable",
    });
    expect(quoteDeparture({ ...departure, tourPublished: false }, 1, NOW)).toMatchObject({
      reason: "not_bookable",
    });
  });
});

describe("checkoutSchema", () => {
  it("accepts a valid form and coerces travellers", () => {
    const r = checkoutSchema.safeParse(valid);
    expect(r.success).toBe(true);
    expect(r.data?.travellers).toBe(2);
  });

  it("drops a tampered price field instead of trusting it", () => {
    const r = checkoutSchema.safeParse({ ...valid, total_cents: "1", priceCents: "1" });
    expect(r.success).toBe(true);
    expect(r.data).not.toHaveProperty("total_cents");
    expect(r.data).not.toHaveProperty("priceCents");
  });

  it.each(["0", "-1", "1.5", "abc", String(MAX_TRAVELLERS + 1)])(
    "rejects %s travellers",
    (travellers) => {
      const r = checkoutSchema.safeParse({ ...valid, travellers });
      expect(r.success).toBe(false);
      expect(fieldErrors(r.error!).travellers).toBeTruthy();
    },
  );

  it("requires accepting the terms", () => {
    const r = checkoutSchema.safeParse({ ...valid, terms: undefined });
    expect(fieldErrors(r.error!).terms).toMatch(/condiciones/);
  });

  it("rejects a filled honeypot, bad email, bad phone and bad departure id", () => {
    const r = checkoutSchema.safeParse({
      ...valid,
      company: "Spam SL",
      email: "nope",
      phone: "12",
      departureId: "1",
    });
    const errors = fieldErrors(r.error!);
    expect(Object.keys(errors).sort()).toEqual(["company", "departureId", "email", "phone"]);
  });
});
