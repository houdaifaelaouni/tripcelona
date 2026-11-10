import { describe, expect, it } from "vitest";
import { assessHealth, type HealthInput } from "@/lib/ops/health";

const now = new Date("2026-11-20T12:00:00Z");
const ago = (min: number) => new Date(now.getTime() - min * 60_000).toISOString();
const base = (over: Partial<HealthInput> = {}): HealthInput => ({
  now,
  hours: 24,
  bookings: [],
  payments: [],
  paymentEvents: [],
  bookingEmails: [],
  paidWithoutConfirmation: [],
  formEmailErrors: [],
  staleHolds: 0,
  ...over,
});

describe("assessHealth", () => {
  it("is ok on a quiet day", () => {
    const r = assessHealth(base());
    expect(r.status).toBe("ok");
    expect(r.alerts).toEqual([]);
    expect(r.funnel.conversion).toBeNull();
  });

  it("computes the funnel and flags abandoned checkouts as P2", () => {
    const r = assessHealth(
      base({
        bookings: [
          { reference: "TC-1", status: "paid", created_at: ago(120) },
          { reference: "TC-2", status: "pending", created_at: ago(90) },
          { reference: "TC-3", status: "pending", created_at: ago(5) }, // still paying
          { reference: "TC-0", status: "paid", created_at: ago(60 * 30) }, // outside window
        ],
      }),
    );
    expect(r.funnel).toEqual({ started: 3, paid: 1, abandoned: 1, conversion: 1 / 3 });
    expect(r.status).toBe("ok");
    expect(r.alerts).toHaveLength(1);
    expect(r.alerts[0]).toMatchObject({ severity: "P2", refs: ["TC-2"] });
  });

  it("is critical when seat holds stop expiring", () => {
    const r = assessHealth(base({ staleHolds: 3 }));
    expect(r.status).toBe("critical");
    expect(r.alerts[0].severity).toBe("P0");
  });

  it("is critical when a paid booking has no confirmation email", () => {
    const r = assessHealth(base({ paidWithoutConfirmation: ["TC-9"] }));
    expect(r.status).toBe("critical");
    expect(r.alerts[0].refs).toEqual(["TC-9"]);
  });

  it("is critical on amount mismatches, not on ordinary declines", () => {
    const declined = assessHealth(
      base({ paymentEvents: [{ outcome: "failed", provider_ref: "A1", received_at: ago(10) }] }),
    );
    expect(declined.status).toBe("ok");
    const mismatch = assessHealth(
      base({
        paymentEvents: [
          { outcome: "amount_mismatch", provider_ref: "A2", received_at: ago(10) },
          { outcome: "amount_mismatch", provider_ref: "A2", received_at: ago(9) },
        ],
      }),
    );
    expect(mismatch.status).toBe("critical");
    expect(mismatch.alerts[0].refs).toEqual(["A2"]);
  });

  it("warns about failed or stuck emails but not one still sending", () => {
    const r = assessHealth(
      base({
        bookingEmails: [
          { kind: "confirmation", status: "failed", updated_at: ago(30), reference: "TC-4" },
          { kind: "owner_alert", status: "sending", updated_at: ago(30), reference: "TC-5" },
          { kind: "confirmation", status: "sending", updated_at: ago(2), reference: "TC-6" },
          { kind: "confirmation", status: "sent", updated_at: ago(2), reference: "TC-7" },
        ],
      }),
    );
    expect(r.status).toBe("warning");
    expect(r.alerts[0].refs).toEqual(["TC-4 (confirmation)", "TC-5 (owner_alert)"]);
    expect(r.emailsSent).toBe(1);
  });

  it("warns when forms were stored but their email failed", () => {
    const r = assessHealth(
      base({ formEmailErrors: [{ kind: "presupuesto", created_at: ago(60) }] }),
    );
    expect(r.status).toBe("warning");
    expect(r.alerts[0].title).toMatch(/formularios/);
  });

  it("warns when several checkouts start and none is paid", () => {
    const bookings = Array.from({ length: 5 }, (_, i) => ({
      reference: `TC-${i}`,
      status: "pending",
      created_at: ago(10),
    }));
    const r = assessHealth(base({ bookings }));
    expect(r.alerts.map((a) => a.title)).toContain("Ninguna reserva pagada");
    expect(r.status).toBe("warning");
  });

  it("lists P0 before P1 before P2", () => {
    const r = assessHealth(
      base({
        staleHolds: 1,
        formEmailErrors: [{ kind: "contacto", created_at: ago(5) }],
        bookings: [{ reference: "TC-8", status: "pending", created_at: ago(100) }],
      }),
    );
    expect(r.alerts.map((a) => a.severity)).toEqual(["P0", "P1", "P2"]);
  });
});
