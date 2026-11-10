import { departureMinutes, madridMonth } from "./format";
import type { Departure, TourSummary } from "./types";

/**
 * Catalog filters (FR-11/FR-12). They live in the URL so results are
 * shareable and back-button safe; parsing is strict so junk params are ignored.
 */
export type CatalogFilters = {
  zona?: string;
  mes?: number; // 1-12
  duracion?: DurationBucket;
  precio?: PriceBucket;
  personas?: number;
  orden: "salida" | "precio";
};

export const DURATION_BUCKETS = {
  "hasta-11h": { label: "Hasta 11 h", min: 0, max: 11 * 60 },
  "11-13h": { label: "De 11 a 13 h", min: 11 * 60 + 1, max: 13 * 60 },
  "mas-13h": { label: "Más de 13 h", min: 13 * 60 + 1, max: Infinity },
} as const;
export type DurationBucket = keyof typeof DURATION_BUCKETS;

export const PRICE_BUCKETS = {
  "hasta-60": { label: "Hasta 60 €", min: 0, max: 6000 },
  "60-80": { label: "De 60 a 80 €", min: 6001, max: 8000 },
  "mas-80": { label: "Más de 80 €", min: 8001, max: Infinity },
} as const;
export type PriceBucket = keyof typeof PRICE_BUCKETS;

type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function int(v: string | undefined, min: number, max: number): number | undefined {
  if (!v || !/^\d+$/.test(v)) return undefined;
  const n = Number(v);
  return n >= min && n <= max ? n : undefined;
}

export function parseCatalogFilters(params: RawParams): CatalogFilters {
  const zona = first(params.zona);
  const duracion = first(params.duracion);
  const precio = first(params.precio);
  return {
    zona: zona && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(zona) ? zona : undefined,
    mes: int(first(params.mes), 1, 12),
    duracion: duracion && duracion in DURATION_BUCKETS ? (duracion as DurationBucket) : undefined,
    precio: precio && precio in PRICE_BUCKETS ? (precio as PriceBucket) : undefined,
    personas: int(first(params.personas), 1, 60),
    orden: first(params.orden) === "precio" ? "precio" : "salida",
  };
}

export function hasActiveFilters(f: CatalogFilters): boolean {
  return Boolean(f.zona || f.mes || f.duracion || f.precio || f.personas);
}

function departureMatches(d: Departure, f: CatalogFilters): boolean {
  if (d.status !== "open") return false;
  if (f.mes && madridMonth(d.startsAt) !== f.mes) return false;
  if (f.personas && d.seatsLeft < f.personas) return false;
  if (f.precio) {
    const b = PRICE_BUCKETS[f.precio];
    if (d.priceCents < b.min || d.priceCents > b.max) return false;
  }
  if (f.duracion) {
    const mins = departureMinutes(d);
    const b = DURATION_BUCKETS[f.duracion];
    if (mins === null || mins < b.min || mins > b.max) return false;
  }
  return true;
}

export type CatalogResult = { tour: TourSummary; match: Departure | null };

/**
 * Applies filters. With no date/size/price/duration filter every tour in the
 * area is listed (even without open departures, so the catalog never looks
 * empty for lack of dates). With one, a tour is listed only if at least one
 * open departure satisfies all of them; that departure is returned as `match`.
 */
export function filterTours(tours: TourSummary[], f: CatalogFilters): CatalogResult[] {
  const departureFilter = Boolean(f.mes || f.personas || f.precio || f.duracion);

  const results: CatalogResult[] = [];
  for (const tour of tours) {
    if (f.zona && tour.areaSlug !== f.zona) continue;
    const match = tour.departures.find((d) => departureMatches(d, f)) ?? null;
    if (departureFilter && !match) continue;
    results.push({ tour, match });
  }

  const nextTime = (r: CatalogResult) =>
    r.match ? Date.parse(r.match.startsAt) : Number.POSITIVE_INFINITY;
  const price = (r: CatalogResult) =>
    r.match?.priceCents ?? r.tour.priceFromCents ?? Number.POSITIVE_INFINITY;

  return results.sort((a, b) =>
    f.orden === "precio"
      ? price(a) - price(b) || nextTime(a) - nextTime(b)
      : nextTime(a) - nextTime(b) || price(a) - price(b),
  );
}

/** URL for a filter set, used by the form's "clear" link and sort switch. */
export function catalogHref(f: Partial<CatalogFilters>): string {
  const p = new URLSearchParams();
  if (f.zona) p.set("zona", f.zona);
  if (f.mes) p.set("mes", String(f.mes));
  if (f.duracion) p.set("duracion", f.duracion);
  if (f.precio) p.set("precio", f.precio);
  if (f.personas) p.set("personas", String(f.personas));
  if (f.orden === "precio") p.set("orden", "precio");
  const qs = p.toString();
  return qs ? `/ofertas-de-viajes?${qs}` : "/ofertas-de-viajes";
}
