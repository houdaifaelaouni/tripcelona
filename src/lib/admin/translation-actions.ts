"use server";

import { updateTag } from "next/cache";
import { audit } from "@/lib/auth/audit";
import { assertStaff } from "@/lib/auth/staff";
import { CONTENT_TAG } from "@/lib/content/queries";
import { docText, sanitizeDoc } from "@/lib/content/rich-text";
import { createClient } from "@/lib/supabase/server";
import { TOURS_TAG } from "@/lib/tours/queries";
import type { Json } from "@/lib/supabase/database.types";
import { backWith } from "./redirect";
import { parseFieldName, TRANSLATION_LOCALES, type TranslationLocale } from "./translation-fields";

const RICH_SOURCE = {
  tour: { table: "tours", column: "description" },
  post: { table: "posts", column: "content" },
  page: { table: "pages", column: "content" },
} as const;

/**
 * Saves every translated field of one form (one item, one language). A field
 * left empty, or a rich text left identical to the Spanish one, is removed so
 * the site falls back to Spanish for it.
 */
export async function saveTranslations(back: string, locale: string, form: FormData) {
  const staff = await assertStaff("any");
  if (!back.startsWith("/admin/traducciones")) back = "/admin/traducciones";
  if (!(TRANSLATION_LOCALES as readonly string[]).includes(locale))
    backWith(back, { error: "Idioma no válido." });
  const lang = locale as TranslationLocale;
  const db = await createClient();

  const upserts: {
    entity: string;
    entity_id: string;
    locale: string;
    field: string;
    value: Json;
  }[] = [];
  const removals: { entity: string; entity_id: string; field: string }[] = [];
  const spanishCache = new Map<string, string>();

  for (const [name, raw] of form.entries()) {
    const key = parseFieldName(name);
    if (!key || typeof raw !== "string") continue;
    const { entity, id, def } = key;
    let value: Json | null = null;
    if (def.kind === "text" || def.kind === "long") {
      const v = raw.trim();
      if (v.length > 20_000) backWith(back, { error: `${def.label}: texto demasiado largo.` });
      value = v || null;
    } else if (def.kind === "list") {
      const items = raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      value = items.length ? items : null;
    } else {
      const doc = sanitizeDoc(raw);
      const empty = !doc.content.some(
        (b) => b.type !== "paragraph" || docText({ type: "doc", content: [b] }).trim() !== "",
      );
      const source = RICH_SOURCE[entity as keyof typeof RICH_SOURCE];
      let same = false;
      if (source && !empty) {
        const cacheKey = `${entity}:${id}`;
        if (!spanishCache.has(cacheKey)) {
          const { data } = await db
            .from(source.table)
            .select(source.column)
            .eq("id", id)
            .maybeSingle();
          const original = (data as Record<string, unknown> | null)?.[source.column];
          spanishCache.set(cacheKey, JSON.stringify(sanitizeDoc(original ?? null)));
        }
        same = spanishCache.get(cacheKey) === JSON.stringify(doc);
      }
      value = empty || same ? null : (doc as unknown as Json);
    }
    if (value === null) removals.push({ entity, entity_id: id, field: def.field });
    else upserts.push({ entity, entity_id: id, locale: lang, field: def.field, value });
  }

  if (upserts.length) {
    const { error } = await db
      .from("content_translations")
      .upsert(upserts as never, { onConflict: "entity,entity_id,locale,field" });
    if (error) backWith(back, { error: `No se pudo guardar: ${error.message}` });
  }
  for (const r of removals) {
    const { error } = await db
      .from("content_translations")
      .delete()
      .eq("entity", r.entity)
      .eq("entity_id", r.entity_id)
      .eq("locale", lang)
      .eq("field", r.field);
    if (error) backWith(back, { error: `No se pudo guardar: ${error.message}` });
  }

  await audit(staff.id, "translation.save", "content_translations", null, {
    locale: lang,
    saved: upserts.length,
    cleared: removals.length,
    back,
  });
  updateTag(TOURS_TAG);
  updateTag(CONTENT_TAG);
  backWith(back, { ok: "guardado" });
}
