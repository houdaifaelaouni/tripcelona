/** Builds hero-search destinations (FR-02). Shared by the form and tests. */

export const CATALOG_PATH = "/ofertas-de-viajes";
export const QUOTE_PATH = "/crea-tu-tour";

export type TripSearch = { area?: string; month?: string; travellers?: string };

const MONTH_RE = /^(1[0-2]|[1-9])$/;
const AREA_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function clampInt(value: string | undefined, min: number, max: number): number | undefined {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(Math.max(n, min), max);
}

/** Catalog URL with only valid, non-empty filters, in a stable order. */
export function buildCatalogUrl(search: TripSearch): string {
  const params = new URLSearchParams();
  if (search.area && AREA_RE.test(search.area)) params.set("zona", search.area);
  if (search.month && MONTH_RE.test(search.month)) params.set("mes", search.month);
  const travellers = clampInt(search.travellers, 1, 60);
  if (travellers !== undefined) params.set("personas", String(travellers));
  const qs = params.toString();
  return qs ? `${CATALOG_PATH}?${qs}` : CATALOG_PATH;
}

/** Quote request URL for the "Grupos y empresas" tab. */
export function buildQuoteUrl(groupSize: string | undefined): string {
  const size = clampInt(groupSize, 1, 500);
  return size === undefined ? QUOTE_PATH : `${QUOTE_PATH}?grupo=${size}`;
}

export const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;
