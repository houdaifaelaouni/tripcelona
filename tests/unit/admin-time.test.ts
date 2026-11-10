import { describe, expect, it } from "vitest";
import { eurosToCents, isoToMadrid, madridToIso } from "@/lib/admin/time";
import { safeAdminNext } from "@/lib/admin/safe-next";

describe("Madrid time helpers", () => {
  it("converts winter (CET, UTC+1) and summer (CEST, UTC+2) times", () => {
    expect(madridToIso("2026-11-22", "08:00")).toBe("2026-11-22T07:00:00.000Z");
    expect(madridToIso("2026-07-05", "08:00")).toBe("2026-07-05T06:00:00.000Z");
  });

  it("round-trips through the form inputs, including DST change days", () => {
    for (const [date, time] of [
      ["2026-03-29", "08:00"],
      ["2026-10-25", "08:00"],
      ["2026-12-31", "23:30"],
    ]) {
      expect(isoToMadrid(madridToIso(date, time))).toEqual({ date, time });
    }
  });

  it("rejects malformed input", () => {
    expect(() => madridToIso("22/11/2026", "08:00")).toThrow();
  });
});

describe("eurosToCents", () => {
  it.each([
    ["55", 5500],
    ["55,50", 5550],
    ["55.5", 5550],
    [" 79 € ", 7900],
  ])("%s -> %i", (input, cents) => expect(eurosToCents(input)).toBe(cents));
  it.each(["", "-5", "5,555", "abc"])("rejects %s", (input) =>
    expect(eurosToCents(input)).toBeNull(),
  );
});

describe("safeAdminNext", () => {
  it("allows admin paths only", () => {
    expect(safeAdminNext("/admin/reservas?x=1")).toBe("/admin/reservas?x=1");
    for (const bad of [
      "https://evil.com",
      "//evil.com",
      "/excursiones",
      "/admin/login",
      "/admin\\evil",
      null,
    ]) {
      expect(safeAdminNext(bad)).toBe("/admin");
    }
  });
});
