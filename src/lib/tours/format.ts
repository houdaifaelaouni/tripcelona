import type { Locale } from "@/lib/i18n/config";

const TZ = "Europe/Madrid";

/** Intl tag per site language; dates and prices follow the visitor's language. */
export const INTL: Record<Locale, string> = {
  es: "es-ES",
  en: "en-GB",
  fr: "fr-FR",
  ca: "ca-ES",
  it: "it-IT",
};

export function formatPrice(cents: number, locale: Locale = "es"): string {
  const euros = cents / 100;
  return new Intl.NumberFormat(INTL[locale], {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Number.isInteger(euros) ? 0 : 2,
  }).format(euros);
}

/** "domingo, 15 de noviembre de 2026" */
export function formatDateLong(iso: string, locale: Locale = "es"): string {
  return new Intl.DateTimeFormat(INTL[locale], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(iso));
}

/** "dom, 15 nov" */
export function formatDateShort(iso: string, locale: Locale = "es"): string {
  return new Intl.DateTimeFormat(INTL[locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).format(new Date(iso));
}

/** "08:00" */
export function formatTime(iso: string, locale: Locale = "es"): string {
  return new Intl.DateTimeFormat(INTL[locale], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).format(new Date(iso));
}

/** Month number (1-12) of an instant in Madrid time. */
export function madridMonth(iso: string): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { month: "numeric", timeZone: TZ }).format(new Date(iso)),
  );
}

/** Length of a departure in minutes, or null when the return time is unknown. */
export function departureMinutes(d: { startsAt: string; endsAt: string | null }): number | null {
  if (!d.endsAt) return null;
  return Math.round((Date.parse(d.endsAt) - Date.parse(d.startsAt)) / 60_000);
}

/** "10 h 30 min" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Day number and short month ("15", "nov") for the circular date cells. */
export function dateParts(iso: string, locale: Locale = "es"): { day: string; month: string } {
  const parts = new Intl.DateTimeFormat(INTL[locale], {
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: get("day"), month: get("month").replace(".", "") };
}
