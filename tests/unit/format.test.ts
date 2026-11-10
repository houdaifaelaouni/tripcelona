import { describe, expect, it } from "vitest";
import { dateParts } from "@/lib/tours/format";

describe("dateParts", () => {
  it("returns the Madrid day and a short month without the dot", () => {
    expect(dateParts("2026-11-15T07:00:00Z")).toEqual({ day: "15", month: "nov" });
  });

  it("uses Madrid time near midnight UTC", () => {
    expect(dateParts("2026-11-14T23:30:00Z")).toEqual({ day: "15", month: "nov" });
  });
});
