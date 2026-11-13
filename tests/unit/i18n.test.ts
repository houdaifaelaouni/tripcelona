import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { dictionaryFor, createT } from "@/lib/i18n/translate";
import { locales } from "@/lib/i18n/config";
import { HOME_DEFAULTS } from "@/lib/site-content-shared";
import { MONTHS_ES } from "@/lib/search";
import { DURATION_BUCKETS, PRICE_BUCKETS } from "@/lib/tours/filters";
import { destinations, footerColumns, primaryNav } from "@/lib/site";

/** Every t("literal") in the public source, found without running it. */
function literals(): string[] {
  const out = new Set<string>();
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "admin" || e.name === "messages") continue;
        walk(p);
      } else if (/\.tsx?$/.test(e.name)) {
        const src = fs.readFileSync(p, "utf8");
        for (const m of src.matchAll(/(?<![\w.])t\(\s*("(?:[^"\\]|\\.)*")/g)) {
          out.add(JSON.parse(m[1]) as string);
        }
      }
    }
  };
  walk(path.join(process.cwd(), "src"));
  return [...out];
}

const dynamic = [
  ...primaryNav.flatMap((i) => [i.label, ...(i.children ?? []).map((c) => c.label)]),
  ...footerColumns.flatMap((c) => [c.title, ...c.links.map((l) => l.label)]),
  ...destinations.map((d) => d.label),
  ...MONTHS_ES,
  ...Object.values(DURATION_BUCKETS).map((b) => b.label),
  ...Object.values(PRICE_BUCKETS).map((b) => b.label),
  HOME_DEFAULTS.heroTitle,
  HOME_DEFAULTS.heroLead,
  HOME_DEFAULTS.whyTitle,
  HOME_DEFAULTS.stepsTitle,
  HOME_DEFAULTS.groupsTitle,
  HOME_DEFAULTS.seoTitle,
  HOME_DEFAULTS.seoDescription,
  ...HOME_DEFAULTS.groupPoints,
  ...[...HOME_DEFAULTS.reasons, ...HOME_DEFAULTS.steps].flatMap((p) => [p.title, p.body]),
];

describe("translations", () => {
  const keys = [...new Set([...literals(), ...dynamic])].filter((k) => /\p{L}/u.test(k));
  for (const locale of locales.filter((l) => l !== "es")) {
    it(`${locale} covers every source string`, () => {
      const dict = dictionaryFor(locale);
      const missing = keys.filter((k) => !(k in dict));
      expect(missing).toEqual([]);
    });
    it(`${locale} keeps the {placeholders} of the source`, () => {
      const dict = dictionaryFor(locale);
      const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
      for (const [k, v] of Object.entries(dict)) expect(vars(v), k).toBe(vars(k));
    });
  }
  it("translates server messages that carry their own numbers", () => {
    expect(createT("en")("Solo quedan 3 plazas.")).toBe("Only 3 seats left.");
    expect(createT("it")("Máximo 500 caracteres.")).toBe("Massimo 500 caratteri.");
  });
  it("fills variables and falls back to Spanish", () => {
    expect(createT("en")("Llamar al {phone}", { phone: "1" })).toBe("Call 1");
    expect(createT("fr")("Texto sin traducir")).toBe("Texto sin traducir");
  });
});
