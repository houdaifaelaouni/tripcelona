import { describe, expect, it } from "vitest";
import { bookingCanBeAnonymised } from "@/lib/admin/privacy";

const NOW = Date.parse("2026-11-15T12:00:00Z");

describe("bookingCanBeAnonymised", () => {
  it("allows closed bookings", () => {
    expect(bookingCanBeAnonymised("cancelled", null, NOW)).toBe(true);
    expect(bookingCanBeAnonymised("refunded", "2026-12-01T07:00:00Z", NOW)).toBe(true);
  });
  it("allows paid bookings only after the excursion", () => {
    expect(bookingCanBeAnonymised("paid", "2026-11-01T07:00:00Z", NOW)).toBe(true);
    expect(bookingCanBeAnonymised("paid", "2026-11-22T07:00:00Z", NOW)).toBe(false);
  });
  it("never allows pending bookings", () => {
    expect(bookingCanBeAnonymised("pending", "2026-11-01T07:00:00Z", NOW)).toBe(false);
  });
});
