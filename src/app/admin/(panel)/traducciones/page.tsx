import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/admin/flash";
import { Button } from "@/components/admin/button";
import { Input, Textarea } from "@/components/admin/fields";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { EmptyState, PageTitle, Panel, ProgressBar, Table, td, th } from "@/components/admin/ui";
import { mediaOptions } from "@/lib/admin/media-options";
import { saveTranslations } from "@/lib/admin/translation-actions";
import {
  fieldName,
  TRANSLATABLE,
  TRANSLATION_LOCALES,
  type FieldDef,
  type TranslationLocale,
} from "@/lib/admin/translation-fields";
import { requireStaff } from "@/lib/auth/staff";
import { docText, sanitizeDoc } from "@/lib/content/rich-text";
import { localeNames } from "@/lib/i18n/config";
import type { Entity } from "@/lib/i18n/overlay";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Traducciones" };

const KINDS = {
  tour: { label: "Excursiones", table: "tours" },
  post: { label: "Blog", table: "posts" },
  page: { label: "Páginas", table: "pages" },
  faq: { label: "Preguntas frecuentes", table: "faqs" },
} as const;
type Kind = keyof typeof KINDS;

type Row = { id: string } & Record<string, unknown>;
type Item = { entity: Entity; row: Row; heading?: string };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Translations of database content into the four other site languages
 * (content_translations). Spanish stays in each editor; an empty field here
 * means the site shows the Spanish text for it.
 */
export default async function TranslationsAdmin({
  searchParams,
}: PageProps<"/admin/traducciones">) {
  await requireStaff();
  const sp = await searchParams;
  const kind = (one(sp.tipo) ?? "tour") as Kind;
  if (!(kind in KINDS)) notFound();
  const lang = (one(sp.lang) ?? "en") as TranslationLocale;
  if (!TRANSLATION_LOCALES.includes(lang)) notFound();
  const id = one(sp.id);
  if (id && !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await createClient();

  const href = (p: { tipo?: Kind; id?: string | null; lang?: TranslationLocale }) => {
    const q = new URLSearchParams({ tipo: p.tipo ?? kind, lang: p.lang ?? lang });
    const target = p.id === undefined ? id : p.id;
    if (target) q.set("id", target);
    return `/admin/traducciones?${q}`;
  };

  const tabs = (
    <nav aria-label="Tipo de contenido" className="mb-6 flex flex-wrap gap-2">
      {(Object.keys(KINDS) as Kind[]).map((k) => (
        <Link
          key={k}
          href={href({ tipo: k, id: null })}
          aria-current={k === kind ? "page" : undefined}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-semibold",
            k === kind
              ? "bg-brand-solid text-white"
              : "bg-secondary text-secondary hover:bg-tertiary",
          )}
        >
          {KINDS[k].label}
        </Link>
      ))}
    </nav>
  );
  const langTabs = (
    <nav aria-label="Idioma" className="mb-6 flex flex-wrap gap-2">
      {TRANSLATION_LOCALES.map((l) => (
        <Link
          key={l}
          href={href({ lang: l })}
          aria-current={l === lang ? "page" : undefined}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium",
            l === lang ? "border-brand bg-brand-primary text-brand-secondary" : "border-secondary",
          )}
        >
          {localeNames[l]}
        </Link>
      ))}
    </nav>
  );

  // ---- Items to edit -------------------------------------------------------
  let items: Item[] = [];
  let title = "";
  if (kind === "faq") {
    const { data } = await db
      .from("faqs")
      .select("id, category, question, answer")
      .neq("status", "archived")
      .order("sort_order");
    items = (data ?? []).map((row) => ({ entity: "faq", row }));
    title = "Preguntas frecuentes";
  } else if (id) {
    if (kind === "tour") {
      const { data: tour } = await db.from("tours").select("*").eq("id", id).maybeSingle();
      if (!tour) notFound();
      const [{ data: stops }, { data: faqs }] = await Promise.all([
        db
          .from("tour_itinerary")
          .select("id, time_label, title, body")
          .eq("tour_id", id)
          .order("sort_order"),
        db.from("tour_faqs").select("id, question, answer").eq("tour_id", id).order("sort_order"),
      ]);
      title = tour.title;
      items = [
        { entity: "tour", row: tour as unknown as Row },
        ...(stops ?? []).map((row, i) => ({
          entity: "tour_itinerary" as const,
          row,
          heading: `Parada ${i + 1}`,
        })),
        ...(faqs ?? []).map((row, i) => ({
          entity: "tour_faq" as const,
          row,
          heading: `Pregunta ${i + 1}`,
        })),
      ];
    } else {
      const { data } = await db.from(KINDS[kind].table).select("*").eq("id", id).maybeSingle();
      if (!data) notFound();
      title = (data as { title: string }).title;
      items = [{ entity: kind, row: data as unknown as Row }];
    }
  }

  // ---- List view (tours, posts, pages) --------------------------------------
  if (kind !== "faq" && !id) {
    const { data: list } = await db
      .from(KINDS[kind].table)
      .select("id, title, status")
      .neq("status", "archived")
      .order("title");
    const ids = (list ?? []).map((r) => r.id);
    const { data: done } = ids.length
      ? await db
          .from("content_translations")
          .select("entity_id, locale")
          .eq("entity", kind)
          .in("entity_id", ids)
      : { data: [] };
    const total = TRANSLATABLE[kind].length;
    const count = (rowId: string, l: string) =>
      (done ?? []).filter((d) => d.entity_id === rowId && d.locale === l).length;
    return (
      <>
        <PageTitle description="Traduce el contenido de la base de datos. Lo que dejes vacío se muestra en español.">
          Traducciones
        </PageTitle>
        {tabs}
        <Panel title={KINDS[kind].label}>
          {(list ?? []).length === 0 ? (
            <EmptyState illustration="notebook" title="No hay nada que traducir">
              Crea contenido en su editor y vuelve aquí para traducirlo.
            </EmptyState>
          ) : (
            <Table className="-mx-5 -my-5">
              <thead>
                <tr>
                  <th className={th}>Título</th>
                  {TRANSLATION_LOCALES.map((l) => (
                    <th key={l} className={th}>
                      {l.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(list ?? []).map((r) => (
                  <tr key={r.id}>
                    <td className={td}>
                      <Link
                        href={href({ id: r.id })}
                        className="font-semibold text-primary hover:underline"
                      >
                        {r.title}
                      </Link>
                      {r.status === "draft" && <span className="ml-2 text-xs">(borrador)</span>}
                    </td>
                    {TRANSLATION_LOCALES.map((l) => (
                      <td key={l} className={cn(td, "min-w-24")}>
                        <Link
                          href={href({ id: r.id, lang: l })}
                          aria-label={`${r.title} en ${localeNames[l]}`}
                        >
                          <ProgressBar value={Math.round((count(r.id, l) / total) * 100)} />
                        </Link>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      </>
    );
  }

  // ---- Edit view -------------------------------------------------------------
  const ids = items.map((i) => i.row.id);
  const { data: existing } = ids.length
    ? await db
        .from("content_translations")
        .select("entity, entity_id, field, value")
        .eq("locale", lang)
        .in("entity_id", ids)
    : { data: [] };
  const current = new Map(
    (existing ?? []).map((t) => [`${t.entity}|${t.entity_id}|${t.field}`, t.value]),
  );
  const hasRich = items.some((i) => TRANSLATABLE[i.entity].some((d) => d.kind === "rich"));
  const media = hasRich ? await mediaOptions(60) : [];
  const back = href({});

  return (
    <>
      <PageTitle
        back={kind === "faq" ? undefined : { href: href({ id: null }), label: KINDS[kind].label }}
        description="El texto en español sale debajo de cada campo como referencia. Deja un campo vacío para mostrar el español."
      >
        {title} · {localeNames[lang]}
      </PageTitle>
      {kind === "faq" && tabs}
      <Flash ok={one(sp.ok)} error={one(sp.error)} />
      {langTabs}
      {items.length === 0 ? (
        <EmptyState illustration="notebook" title="No hay nada que traducir">
          Crea contenido en su editor y vuelve aquí para traducirlo.
        </EmptyState>
      ) : (
        <form action={saveTranslations.bind(null, back, lang)} className="grid gap-6 pb-24">
          {items.map((item) => (
            <Panel
              key={`${item.entity}:${item.row.id}`}
              title={item.heading ?? (item.entity === "faq" ? String(item.row.question) : "Ficha")}
            >
              <div className="grid gap-5">
                {TRANSLATABLE[item.entity].map((def) => (
                  <TranslatedField
                    key={def.field}
                    def={def}
                    name={fieldName(item.entity, item.row.id, def.field)}
                    spanish={item.row[def.field]}
                    value={current.get(`${item.entity}|${item.row.id}|${def.field}`)}
                    media={media}
                  />
                ))}
              </div>
            </Panel>
          ))}
          <div className="fixed inset-x-0 bottom-0 z-20 flex justify-end border-t border-secondary bg-primary px-4 py-3 lg:left-(--sidebar-offset)">
            <Button type="submit" size="lg">
              Guardar traducción ({localeNames[lang]})
            </Button>
          </div>
        </form>
      )}
    </>
  );
}

function spanishText(def: FieldDef, value: unknown): string {
  if (value == null) return "";
  if (def.kind === "rich") return docText(sanitizeDoc(value)).slice(0, 400);
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string").join(" · ");
  return String(value);
}

function TranslatedField({
  def,
  name,
  spanish,
  value,
  media,
}: {
  def: FieldDef;
  name: string;
  spanish: unknown;
  value: unknown;
  media: Awaited<ReturnType<typeof mediaOptions>>;
}) {
  const es = spanishText(def, spanish);
  if (!es && value == null) return null; // Nothing in Spanish, nothing to translate.
  const hint = es ? `ES: ${es}` : undefined;
  if (def.kind === "rich")
    return (
      <div>
        <p className="mb-1.5 text-sm font-medium text-secondary">{def.label}</p>
        {/* Starts from the Spanish text so it can be translated in place; saved
            unchanged it is ignored and the page keeps showing Spanish. */}
        <RichTextEditor name={name} initial={value ?? spanish} images={media} label={def.label} />
        {value == null && (
          <p className="mt-1.5 text-sm text-tertiary">
            Sin traducir: ahora muestra el texto en español.
          </p>
        )}
      </div>
    );
  if (def.kind === "list")
    return (
      <Textarea
        label={def.label}
        name={name}
        rows={4}
        defaultValue={Array.isArray(value) ? value.join("\n") : ""}
        hint={hint}
      />
    );
  if (def.kind === "long")
    return (
      <Textarea
        label={def.label}
        name={name}
        rows={3}
        defaultValue={typeof value === "string" ? value : ""}
        hint={hint}
      />
    );
  return (
    <Input
      label={def.label}
      name={name}
      defaultValue={typeof value === "string" ? value : ""}
      hint={hint}
    />
  );
}
