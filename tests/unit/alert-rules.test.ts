import { describe, expect, it } from "vitest";
import {
  DEFAULT_RULES,
  evaluateRule,
  headline,
  ruleSentence,
  rulesFromValue,
  type AlertData,
  type AlertRule,
} from "@/lib/ops/alert-rules";

const now = "2026-11-22T10:00:00Z";
const inH = (h: number) => new Date(Date.parse(now) + h * 3_600_000).toISOString();
const data = (over: Partial<AlertData> = {}): AlertData => ({
  now,
  departures: [],
  openRequests: [],
  unpaidBookings: [],
  ...over,
});
const rule = <T extends AlertRule["id"]>(
  id: T,
  over: Partial<Extract<AlertRule, { id: T }>> = {},
) => ({ ...DEFAULT_RULES.find((r) => r.id === id)!, ...over }) as Extract<AlertRule, { id: T }>;
const dep = (id: string, h: number, capacity: number, seatsTaken: number) => ({
  id,
  startsAt: inH(h),
  capacity,
  seatsTaken,
  tour: "Andorra",
});

describe("rulesFromValue", () => {
  it("falls back to the defaults", () => {
    expect(rulesFromValue(null)).toEqual(DEFAULT_RULES);
    expect(rulesFromValue({ rules: "x" })).toEqual(DEFAULT_RULES);
  });

  it("keeps saved values and clamps bad ones", () => {
    const r = rulesFromValue({
      rules: [
        { id: "high_fill", enabled: false, action: "panel", percent: 250 },
        { id: "low_fill", days: "7", percent: -3 },
        { id: "unanswered_requests", hours: "abc", action: "sms" },
        null,
      ],
    });
    expect(r[0]).toEqual({ id: "high_fill", enabled: false, action: "panel", percent: 100 });
    expect(r[1]).toMatchObject({ days: 7, percent: 1, enabled: true });
    expect(r[2]).toMatchObject({ hours: 24, action: "email" });
    expect(r.map((x) => x.id)).toEqual(DEFAULT_RULES.map((x) => x.id));
  });
});

describe("evaluateRule", () => {
  it("high_fill flags nearly full departures, not full ones", () => {
    const ev = evaluateRule(
      rule("high_fill", { percent: 80 }),
      data({ departures: [dep("a", 48, 10, 9), dep("b", 72, 10, 10), dep("c", 96, 10, 5)] }),
    );
    expect(ev.hits.map((h) => h.key)).toEqual(["a"]);
    expect(ev.hits[0].href).toBe("/admin/salidas/a");
    expect(ev.series.map((s) => s.over)).toEqual([true, false, false]);
    expect(ev.threshold).toBe(80);
  });

  it("low_fill only flags departures leaving soon", () => {
    const ev = evaluateRule(
      rule("low_fill", { days: 4, percent: 40 }),
      data({
        departures: [dep("soon", 48, 50, 10), dep("later", 24 * 10, 50, 5), dep("ok", 24, 50, 30)],
      }),
    );
    expect(ev.hits.map((h) => h.key)).toEqual(["soon"]);
    expect(ev.series).toHaveLength(3);
  });

  it("unanswered_requests counts hours since creation", () => {
    const ev = evaluateRule(
      rule("unanswered_requests", { hours: 24 }),
      data({
        openRequests: [
          { id: "old", createdAt: inH(-30), label: "Grupo 20" },
          { id: "new", createdAt: inH(-2), label: "Ana" },
        ],
      }),
    );
    expect(ev.hits).toHaveLength(1);
    expect(ev.hits[0].text).toContain("30 h");
    expect(headline(rule("unanswered_requests"), ev)).toBe(1);
  });

  it("abandoned buckets unpaid bookings per Madrid day", () => {
    const today = Array.from({ length: 3 }, () => ({ createdAt: inH(-1) }));
    const lastWeek = Array.from({ length: 4 }, () => ({ createdAt: inH(-24 * 7) }));
    const r = rule("abandoned", { count: 2 });
    const ev = evaluateRule(r, data({ unpaidBookings: [...today, ...lastWeek] }));
    expect(ev.series).toHaveLength(30);
    expect(ev.series.at(-1)!.value).toBe(3);
    expect(ev.hits).toHaveLength(1);
    expect(headline(r, ev)).toBe(2);
  });
});

describe("ruleSentence", () => {
  it("reads as a sentence with the numbers", () => {
    expect(ruleSentence(rule("low_fill"))).toBe(
      "Cuando a una salida le queden 4 días o menos y tenga menos del 40 % vendido, avisarme por email.",
    );
  });
});
