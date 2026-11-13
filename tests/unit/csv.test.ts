import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/admin/csv";

describe("toCsv", () => {
  it("starts with a BOM and quotes commas, quotes and newlines", () => {
    const out = toCsv(
      ["a", "b"],
      [
        ["x,y", 'say "hi"'],
        ["line\nbreak", null],
      ],
    );
    expect(out.startsWith("﻿")).toBe(true);
    expect(out).toContain('"x,y","say ""hi"""');
    expect(out).toContain('"line\nbreak",');
  });
  it("defuses spreadsheet formulas", () => {
    const out = toCsv(["a"], [["=HYPERLINK(1)"], ["+34 600"], ["-1"], ["@sum"]]);
    expect(out).toContain("'=HYPERLINK(1)");
    expect(out).toContain("'+34 600");
    expect(out).toContain("'@sum");
  });
});
