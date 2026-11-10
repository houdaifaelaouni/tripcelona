import { describe, expect, it } from "vitest";
import { catalogHref, filterTours, parseCatalogFilters } from "@/lib/tours/filters";
import type { Departure, TourSummary } from "@/lib/tours/types";

function dep(
  startsAt: string,
  endsAt: string | null,
  seatsLeft = 20,
  priceCents = 5900,
): Departure {
  return {
    id: startsAt,
    startsAt,
    endsAt,
    seatsLeft,
    priceCents,
    status: seatsLeft ? "open" : "sold_out",
  };
}

function tour(
  slug: string,
  areaSlug: string,
  departures: Departure[],
  priceFromCents = 5900,
): TourSummary {
  return {
    slug,
    title: slug,
    area: areaSlug,
    areaSlug,
    difficulty: null,
    durationMinutes: null,
    priceFromCents,
    image: null,
    departures,
  };
}

// Times in UTC; Madrid is UTC+1 in winter.
const fuego = tour("fuego", "la-garrotxa", [
  dep("2026-11-15T07:00:00Z", "2026-11-15T18:00:00Z", 27, 5900),
]);
const nuria = tour(
  "nuria",
  "ripolles",
  [dep("2026-11-29T06:30:00Z", "2026-11-29T18:30:00Z", 3, 7900)],
  7900,
);
const vero = tour("vero", "huesca", [dep("2026-12-27T06:00:00Z", null, 50, 5900)]);
const salvaje = tour("salvaje", "pallars", [], 7900);
const all = [salvaje, vero, nuria, fuego];

describe("parseCatalogFilters", () => {
  it("accepts valid params and ignores junk", () => {
    expect(
      parseCatalogFilters({
        zona: "osona",
        mes: "12",
        duracion: "11-13h",
        precio: "x",
        personas: "0",
        orden: "precio",
      }),
    ).toEqual({
      zona: "osona",
      mes: 12,
      duracion: "11-13h",
      precio: undefined,
      personas: undefined,
      orden: "precio",
    });
    expect(parseCatalogFilters({ zona: "../x", mes: "13" })).toEqual({
      zona: undefined,
      mes: undefined,
      duracion: undefined,
      precio: undefined,
      personas: undefined,
      orden: "salida",
    });
  });
});

describe("filterTours", () => {
  const slugs = (q: Record<string, string>) =>
    filterTours(all, parseCatalogFilters(q)).map((r) => r.tour.slug);

  it("lists every tour by next departure, dateless tours last", () => {
    expect(slugs({})).toEqual(["fuego", "nuria", "vero", "salvaje"]);
  });

  it("filters by area", () => {
    expect(slugs({ zona: "ripolles" })).toEqual(["nuria"]);
  });

  it("filters by month in Madrid time", () => {
    expect(slugs({ mes: "12" })).toEqual(["vero"]);
    expect(slugs({ mes: "11" })).toEqual(["fuego", "nuria"]);
  });

  it("requires enough seats for the group", () => {
    expect(slugs({ personas: "5" })).toEqual(["fuego", "vero"]);
  });

  it("filters by price bucket", () => {
    expect(slugs({ precio: "60-80" })).toEqual(["nuria"]);
  });

  it("filters by day length and skips unknown return times", () => {
    expect(slugs({ duracion: "hasta-11h" })).toEqual(["fuego"]);
    expect(slugs({ duracion: "11-13h" })).toEqual(["nuria"]);
  });

  it("sorts by price when asked", () => {
    expect(slugs({ orden: "precio" })).toEqual(["fuego", "vero", "nuria", "salvaje"]);
  });

  it("returns nothing when no departure matches", () => {
    expect(slugs({ zona: "pallars", mes: "11" })).toEqual([]);
  });
});

describe("catalogHref", () => {
  it("round-trips filters into a stable URL", () => {
    expect(
      catalogHref(parseCatalogFilters({ precio: "hasta-60", zona: "osona", orden: "precio" })),
    ).toBe("/ofertas-de-viajes?zona=osona&precio=hasta-60&orden=precio");
  });
});
