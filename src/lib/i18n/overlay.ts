import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { defaultLocale, type Locale } from "./config";

export type Entity = "tour" | "tour_itinerary" | "tour_faq" | "faq" | "post" | "page";
export type Overlay = Map<string, Record<string, unknown>>;

/**
 * Translated fields for the given rows in one language, keyed by row id.
 * Empty for Spanish (the original columns) or when nothing is translated, so
 * callers fall back to the Spanish text field by field.
 */
export async function loadOverlay(entity: Entity, ids: string[], locale: Locale): Promise<Overlay> {
  const out: Overlay = new Map();
  if (locale === defaultLocale || ids.length === 0) return out;
  const { data, error } = await createPublicClient()
    .from("content_translations")
    .select("entity_id, field, value")
    .eq("entity", entity)
    .eq("locale", locale)
    .in("entity_id", ids);
  // Translations are an enhancement: if they cannot be read, show Spanish.
  if (error || !data) return out;
  for (const r of data) {
    const row = out.get(r.entity_id) ?? {};
    row[r.field] = r.value;
    out.set(r.entity_id, row);
  }
  return out;
}

export function str(v: unknown, fallback: string): string;
export function str(v: unknown, fallback: string | null): string | null;
export function str(v: unknown, fallback: string | null): string | null {
  return typeof v === "string" && v.trim() ? v : fallback;
}

export function strList(v: unknown, fallback: string[]): string[] {
  return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string")
    ? (v as string[])
    : fallback;
}
