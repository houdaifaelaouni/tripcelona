import type { Entity } from "@/lib/i18n/overlay";

/**
 * Which fields of each kind of content can be translated, and how they are
 * edited. Field names match what the public queries read from the overlay
 * (src/lib/tours/queries.ts, src/lib/content/queries.ts).
 */
export type FieldKind = "text" | "long" | "list" | "rich";
export type FieldDef = { field: string; label: string; kind: FieldKind };

export const TRANSLATABLE: Record<Entity, FieldDef[]> = {
  tour: [
    { field: "title", label: "Título", kind: "text" },
    { field: "area", label: "Zona", kind: "text" },
    { field: "difficulty", label: "Dificultad", kind: "text" },
    { field: "summary", label: "Resumen", kind: "long" },
    { field: "highlights", label: "Destacados (uno por línea)", kind: "list" },
    { field: "description", label: "Descripción completa", kind: "rich" },
    { field: "inclusions", label: "Incluye (uno por línea)", kind: "list" },
    { field: "exclusions", label: "No incluye (uno por línea)", kind: "list" },
    { field: "packing_list", label: "Qué llevar (uno por línea)", kind: "list" },
    { field: "meeting_point", label: "Punto de encuentro", kind: "text" },
    { field: "seo_title", label: "Título SEO", kind: "text" },
    { field: "seo_description", label: "Descripción SEO", kind: "long" },
  ],
  tour_itinerary: [
    { field: "time_label", label: "Hora", kind: "text" },
    { field: "title", label: "Parada", kind: "text" },
    { field: "body", label: "Texto", kind: "long" },
  ],
  tour_faq: [
    { field: "question", label: "Pregunta", kind: "text" },
    { field: "answer", label: "Respuesta", kind: "long" },
  ],
  faq: [
    { field: "category", label: "Categoría", kind: "text" },
    { field: "question", label: "Pregunta", kind: "text" },
    { field: "answer", label: "Respuesta", kind: "long" },
  ],
  post: [
    { field: "title", label: "Título", kind: "text" },
    { field: "excerpt", label: "Extracto", kind: "long" },
    { field: "content", label: "Texto", kind: "rich" },
    { field: "seo_title", label: "Título SEO", kind: "text" },
    { field: "seo_description", label: "Descripción SEO", kind: "long" },
  ],
  page: [
    { field: "title", label: "Título", kind: "text" },
    { field: "content", label: "Texto", kind: "rich" },
    { field: "seo_title", label: "Título SEO", kind: "text" },
    { field: "seo_description", label: "Descripción SEO", kind: "long" },
  ],
};

export const TRANSLATION_LOCALES = ["en", "fr", "ca", "it"] as const;
export type TranslationLocale = (typeof TRANSLATION_LOCALES)[number];

/** Form field name for one translated value: t|<entity>|<id>|<field>. */
export const fieldName = (entity: Entity, id: string, field: string) =>
  `t|${entity}|${id}|${field}`;

export function parseFieldName(name: string): { entity: Entity; id: string; def: FieldDef } | null {
  const [prefix, entity, id, field] = name.split("|");
  if (
    prefix !== "t" ||
    !Object.hasOwn(TRANSLATABLE, entity ?? "") ||
    !/^[0-9a-f-]{36}$/i.test(id ?? "")
  )
    return null;
  const def = TRANSLATABLE[entity as Entity].find((d) => d.field === field);
  return def ? { entity: entity as Entity, id: id!, def } : null;
}
