import { describe, expect, it } from "vitest";
import { buildCatalogUrl, buildQuoteUrl } from "@/lib/search";

describe("buildCatalogUrl", () => {
  it("returns the bare catalog path with no filters", () => {
    expect(buildCatalogUrl({})).toBe("/ofertas-de-viajes");
  });

  it("keeps valid filters in a stable order", () => {
    expect(buildCatalogUrl({ travellers: "2", month: "12", area: "la-garrotxa" })).toBe(
      "/ofertas-de-viajes?zona=la-garrotxa&mes=12&personas=2",
    );
  });

  it("drops invalid area and month values", () => {
    expect(buildCatalogUrl({ area: "../etc", month: "13" })).toBe("/ofertas-de-viajes");
  });

  it("clamps traveller counts", () => {
    expect(buildCatalogUrl({ travellers: "0" })).toBe("/ofertas-de-viajes?personas=1");
    expect(buildCatalogUrl({ travellers: "999" })).toBe("/ofertas-de-viajes?personas=60");
    expect(buildCatalogUrl({ travellers: "abc" })).toBe("/ofertas-de-viajes");
  });
});

describe("buildQuoteUrl", () => {
  it("passes a valid group size", () => {
    expect(buildQuoteUrl("25")).toBe("/crea-tu-tour?grupo=25");
  });
  it("ignores empty input", () => {
    expect(buildQuoteUrl("")).toBe("/crea-tu-tour");
  });
});
