/**
 * Legacy content import (US-31, US-32): WordPress posts, pages, legal pages and
 * FAQs -> Supabase, as sanitised rich-text JSON. Idempotent and re-runnable.
 *
 *   pnpm content:import --wxr export.xml [--dry-run] [--overwrite]
 *   pnpm content:import --wp-api https://tripcelona.com [--dry-run] [--overwrite]
 *   (--report <file> to write the report elsewhere)
 *
 * - Copy is taken verbatim from WordPress; only markup is changed.
 * - Internal links are rewritten through migration/urls.csv.
 * - Images are registered as media rows (source_url = legacy file) so
 *   `pnpm media:sync` copies them into Storage.
 * - Existing rows with the same slug are left alone unless --overwrite, so
 *   a re-run never wipes edits made in the admin.
 * - Writes migration/import-report.json and exits 1 if anything failed.
 */
import { readFile, writeFile } from "node:fs/promises";
import { contentMediaPath, isLegacyUpload } from "@/lib/content/images";
import { extractFaqs } from "@/lib/content/faq-extract";
import {
  cleanLegacyHtml,
  docImages,
  fullSize,
  htmlToDoc,
  legacyLinkRewriter,
  stripProductFacts,
  urlMapFromCsv,
} from "@/lib/content/html-to-doc";
import { docText, isEmptyDoc, readingMinutes, type RichDoc } from "@/lib/content/rich-text";
import { fetchRest, parseWxr, type LegacyItem } from "@/lib/content/wordpress";
import { placeholderAlt } from "@/lib/media/pipeline";
import { createAdminClient } from "@/lib/supabase/admin";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const dryRun = flag("--dry-run");
const overwrite = flag("--overwrite");
const wxrPath = option("--wxr");
const apiBase = option("--wp-api");
const reportPath = option("--report") ?? "migration/import-report.json";

/** Pages served by their own routes; their copy is not imported as a page. */
const OWN_ROUTES = new Set([
  "",
  "bienvenido", // WordPress front page -> /
  "ofertas-de-viajes",
  "crea-tu-tour",
  "contactanos",
  "preguntas-frecuentes",
  "eventos",
  "blog",
  "blogs",
  "reservar", // cart / checkout
  "gracias-pagina", // old WooCommerce thank-you page; /reservar/confirmada replaces it
]);
const FAQ_SLUG = "preguntas-frecuentes";
const LEGAL = new Set([
  "politica-de-privacidad",
  "politica-de-devoluciones",
  "condiciones-de-contratacion",
  "politica-de-cookies",
  "aviso-legal",
]);
const PLACEHOLDER = /lorem ipsum|dolor sit amet|\[insertar/i;
const PERSONAL_EMAIL = /[\w.+-]+@gmail\.com/i;

type Report = {
  source: string;
  imported: string[];
  skipped: string[];
  warnings: string[];
  failed: { item: string; error: string }[];
  media: number;
  faqs: number;
};

async function loadItems(): Promise<LegacyItem[]> {
  if (wxrPath) return parseWxr(await readFile(wxrPath, "utf8"));
  if (apiBase) return fetchRest(apiBase);
  throw new Error("Pass --wxr <export.xml> or --wp-api <https://site>.");
}

async function main() {
  const db = createAdminClient();
  const urlMap = urlMapFromCsv(await readFile("migration/urls.csv", "utf8"));
  const rewrite = legacyLinkRewriter(urlMap);
  const items = (await loadItems()).filter(
    (i) =>
      i.slug && i.status !== "trash" && i.status !== "auto-draft" && !i.slug.endsWith("__trashed"),
  );
  const report: Report = {
    source: wxrPath ?? apiBase ?? "",
    imported: [],
    skipped: [],
    warnings: [],
    failed: [],
    media: 0,
    faqs: 0,
  };

  const mediaIds = new Map<string, string>();
  async function registerMedia(url: string, alt: string): Promise<string | null> {
    if (!isLegacyUpload(url)) return null;
    const original = fullSize(url);
    if (mediaIds.has(original)) return mediaIds.get(original)!;
    if (dryRun) return null;
    const path = contentMediaPath(original);
    const { data: existing } = await db
      .from("media")
      .select("id")
      .eq("source_url", original)
      .maybeSingle();
    if (existing) {
      mediaIds.set(original, existing.id);
      return existing.id;
    }
    const { data, error } = await db
      .from("media")
      .upsert(
        { bucket: "media", path, source_url: original, alt: alt || placeholderAlt(path) },
        { onConflict: "bucket,path" },
      )
      .select("id")
      .single();
    if (error) throw new Error(`media ${path}: ${error.message}`);
    mediaIds.set(original, data.id);
    report.media++;
    return data.id;
  }

  function check(label: string, doc: RichDoc, removed: string[] = []) {
    if (isEmptyDoc(doc))
      report.warnings.push(`${label}: no text after cleaning (builder-only page?)`);
    const text = docText(doc);
    if (PLACEHOLDER.test(text)) report.warnings.push(`${label}: contains placeholder text`);
    const gmail = text.match(PERSONAL_EMAIL);
    if (gmail)
      report.warnings.push(`${label}: mentions personal email ${gmail[0]} (PRD §5.5: replace)`);
    for (const sc of removed) report.warnings.push(`${label}: removed shortcode ${sc}`);
    for (const img of docImages(doc)) {
      if (!img.alt) report.warnings.push(`${label}: image without alt text ${img.src}`);
    }
  }

  async function exists(table: "posts" | "pages", slug: string) {
    const { data } = await db.from(table).select("id").eq("slug", slug).maybeSingle();
    return Boolean(data);
  }

  for (const item of items) {
    const label = `${item.type}:${item.slug}`;
    try {
      const published = item.status === "publish";

      if (item.type === "product") {
        // Tour copy only: dates, prices and seats live in tours/tour_departures.
        const { data: tour } = await db
          .from("tours")
          .select("id, description")
          .eq("slug", item.slug)
          .maybeSingle();
        if (!tour) {
          report.warnings.push(
            `${label} (${item.status}): no tour with this slug; not imported. Create it in the admin if it should be sold.`,
          );
          continue;
        }
        if (tour.description && !overwrite) {
          report.skipped.push(`${label} (tour description exists)`);
          continue;
        }
        const cleaned = cleanLegacyHtml(stripProductFacts(item.html), item.title);
        const doc = htmlToDoc(cleaned.html, rewrite);
        check(label, doc, cleaned.removedShortcodes);
        for (const img of docImages(doc)) await registerMedia(img.src, img.alt);
        if (!dryRun) {
          const { error } = await db
            .from("tours")
            .update({ description: doc as never })
            .eq("id", tour.id);
          if (error) throw new Error(error.message);
        }
        report.imported.push(label);
        continue;
      }

      const cleaned = cleanLegacyHtml(item.html, item.title);
      const doc = htmlToDoc(cleaned.html, rewrite);

      if (item.type === "post") {
        if (!overwrite && (await exists("posts", item.slug))) {
          report.skipped.push(`${label} (exists)`);
          continue;
        }
        check(label, doc, cleaned.removedShortcodes);
        for (const img of docImages(doc)) await registerMedia(img.src, img.alt);
        const coverId = item.coverUrl ? await registerMedia(item.coverUrl, "") : null;
        if (!dryRun) {
          const { error } = await db.from("posts").upsert(
            {
              slug: item.slug,
              title: item.title,
              excerpt: item.excerpt || null,
              content: doc as never,
              cover_id: coverId,
              status: published ? "published" : "draft",
              published_at: published ? item.date : null,
              seo_title: item.seoTitle,
              seo_description:
                item.seoDescription ?? (item.excerpt ? item.excerpt.slice(0, 160) : null),
              reading_minutes: readingMinutes(doc),
              tags: item.tags,
              source_url: item.link || null,
            },
            { onConflict: "slug" },
          );
          if (error) throw new Error(error.message);
        }
        report.imported.push(label);
        continue;
      }

      // Pages
      if (item.slug === FAQ_SLUG) {
        const faqs = extractFaqs(item.html);
        if (!faqs.length) {
          report.warnings.push(`${label}: no FAQ items recognised; add them in the admin`);
          continue;
        }
        const source = item.link || `https://tripcelona.com/${FAQ_SLUG}/`;
        const { count } = await db
          .from("faqs")
          .select("id", { count: "exact", head: true })
          .eq("source_url", source);
        if ((count ?? 0) > 0 && !overwrite) {
          report.skipped.push(`${label} (${count} FAQs exist)`);
          continue;
        }
        if (!dryRun) {
          await db.from("faqs").delete().eq("source_url", source);
          const { error } = await db.from("faqs").insert(
            faqs.map((f, i) => ({
              question: f.question,
              answer: f.answer,
              sort_order: (i + 1) * 10,
              status: "published" as const,
              source_url: source,
            })),
          );
          if (error) throw new Error(error.message);
        }
        for (const f of faqs) {
          const gmail = f.answer.match(PERSONAL_EMAIL);
          if (gmail)
            report.warnings.push(
              `faq "${f.question}": mentions personal email ${gmail[0]} (PRD §5.5: replace)`,
            );
        }
        report.faqs = faqs.length;
        report.imported.push(`${label} (${faqs.length} FAQs)`);
        continue;
      }

      const newPath = urlMap.get(`/${item.slug}/`) ?? `/${item.slug}`;
      const slug = newPath.replace(/^\//, "");
      if (OWN_ROUTES.has(slug) || slug.includes("/")) {
        report.skipped.push(`${label} (served by its own route ${newPath})`);
        continue;
      }
      if (!overwrite && (await exists("pages", slug))) {
        report.skipped.push(`${label} (exists)`);
        continue;
      }
      check(label, doc, cleaned.removedShortcodes);
      if (isEmptyDoc(doc)) {
        report.warnings.push(
          `${label}: not imported, nothing left but plugin output; needs its own content`,
        );
        continue;
      }
      for (const img of docImages(doc)) await registerMedia(img.src, img.alt);
      if (!dryRun) {
        const { error } = await db.from("pages").upsert(
          {
            slug,
            title: item.title,
            content: doc as never,
            kind: LEGAL.has(slug) ? "legal" : "page",
            status: published ? "published" : "draft",
            published_at: published ? item.date : null,
            seo_title: item.seoTitle,
            seo_description: item.seoDescription,
            source_url: item.link || null,
          },
          { onConflict: "slug" },
        );
        if (error) throw new Error(error.message);
      }
      report.imported.push(label);
    } catch (err) {
      report.failed.push({ item: label, error: (err as Error).message });
    }
  }

  for (const slug of LEGAL) {
    if (!items.some((i) => i.type === "page" && i.slug === slug)) {
      report.warnings.push(`legal page missing from source: ${slug}`);
    }
  }

  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  console.log(
    `${dryRun ? "[dry run] " : ""}imported ${report.imported.length}, skipped ${report.skipped.length}, ` +
      `warnings ${report.warnings.length}, failed ${report.failed.length}, media ${report.media}, faqs ${report.faqs}`,
  );
  if (report.failed.length) process.exitCode = 1;
  if (!dryRun && report.imported.length) {
    console.log(
      "Published content is cached: publish anything in the admin, or redeploy, to refresh pages.",
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
