/**
 * Reads legacy WordPress content for the importer (US-31), from either a
 * WXR export file (wp-admin → Herramientas → Exportar) or the public REST API.
 */

export type LegacyItem = {
  type: "post" | "page" | "product";
  slug: string;
  title: string;
  html: string;
  excerpt: string;
  status: string; // WordPress status: publish, draft, private...
  date: string | null; // ISO
  modified: string | null;
  link: string;
  coverUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  tags: string[];
};

const decodeEntities = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

export const stripTags = (html: string) =>
  decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

/** Rank Math / Yoast templates such as "%title% %sep% %sitename%" are not usable text. */
const usableMeta = (v: string | null | undefined) => {
  const t = v?.trim();
  return t && !t.includes("%") ? decodeEntities(t) : null;
};

// --- WXR ------------------------------------------------------------------------

function field(xml: string, name: string): string | null {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`);
  const m = xml.match(re);
  if (!m) return null;
  return unCdata(m[1]);
}

function unCdata(s: string): string {
  if (!s.includes("<![CDATA[")) return decodeEntities(s.trim());
  return [...s.matchAll(/<!\[CDATA\[([\s\S]*?)\]\]>/g)].map((m) => m[1]).join("");
}

/** Raw inner XML of every <name> element (CDATA left in place). */
function allRaw(xml: string, name: string): string[] {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "g");
  return [...xml.matchAll(re)].map((m) => m[1]);
}

function postmeta(itemXml: string): Map<string, string> {
  const meta = new Map<string, string>();
  for (const block of allRaw(itemXml, "wp:postmeta")) {
    const key = field(block, "wp:meta_key");
    const value = field(block, "wp:meta_value");
    if (key) meta.set(key, value ?? "");
  }
  return meta;
}

function wpDate(v: string | null): string | null {
  if (!v || v.startsWith("0000")) return null;
  const d = new Date(v.replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function parseWxr(xml: string): LegacyItem[] {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  const attachments = new Map<string, string>();
  for (const it of items) {
    if (field(it, "wp:post_type") === "attachment") {
      const id = field(it, "wp:post_id");
      const url = field(it, "wp:attachment_url");
      if (id && url) attachments.set(id, url);
    }
  }
  const out: LegacyItem[] = [];
  for (const it of items) {
    const type = field(it, "wp:post_type");
    if (type !== "post" && type !== "page" && type !== "product") continue;
    const meta = postmeta(it);
    const tags = [...it.matchAll(/<category domain="post_tag"[^>]*>([\s\S]*?)<\/category>/g)].map(
      (m) => unCdata(m[1]),
    );
    out.push({
      type,
      slug: decodeURIComponent(field(it, "wp:post_name") ?? ""),
      title: decodeEntities(field(it, "title") ?? ""),
      html: field(it, "content:encoded") ?? "",
      excerpt: stripTags(field(it, "excerpt:encoded") ?? ""),
      status: field(it, "wp:status") ?? "draft",
      date: wpDate(field(it, "wp:post_date_gmt")),
      modified: wpDate(field(it, "wp:post_modified_gmt")),
      link: field(it, "link") ?? "",
      coverUrl: attachments.get(meta.get("_thumbnail_id") ?? "") ?? null,
      seoTitle: usableMeta(meta.get("rank_math_title") ?? meta.get("_yoast_wpseo_title")),
      seoDescription: usableMeta(
        meta.get("rank_math_description") ?? meta.get("_yoast_wpseo_metadesc"),
      ),
      tags,
    });
  }
  return out;
}

// --- REST API ---------------------------------------------------------------------

type WpRest = {
  slug: string;
  status: string;
  date_gmt: string | null;
  modified_gmt: string | null;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt?: { rendered: string };
  yoast_head_json?: { title?: string; description?: string };
  _embedded?: {
    "wp:featuredmedia"?: { source_url?: string }[];
    "wp:term"?: { taxonomy: string; name: string }[][];
  };
};

export function fromRest(type: LegacyItem["type"], rows: WpRest[]): LegacyItem[] {
  return rows.map((r) => ({
    type,
    slug: decodeURIComponent(r.slug),
    title: decodeEntities(r.title.rendered),
    html: r.content.rendered,
    excerpt: stripTags(r.excerpt?.rendered ?? ""),
    status: r.status,
    date: r.date_gmt ? new Date(r.date_gmt + "Z").toISOString() : null,
    modified: r.modified_gmt ? new Date(r.modified_gmt + "Z").toISOString() : null,
    link: r.link,
    coverUrl: r._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null,
    seoTitle: usableMeta(r.yoast_head_json?.title),
    seoDescription: usableMeta(r.yoast_head_json?.description),
    tags: (r._embedded?.["wp:term"] ?? [])
      .flat()
      .filter((t) => t.taxonomy === "post_tag")
      .map((t) => t.name),
  }));
}

export async function fetchRest(base: string): Promise<LegacyItem[]> {
  const out: LegacyItem[] = [];
  for (const type of ["post", "page", "product"] as const) {
    for (let page = 1; page < 20; page++) {
      const url = `${base.replace(/\/$/, "")}/wp-json/wp/v2/${type === "product" ? "product" : `${type}s`}?per_page=100&page=${page}&_embed=wp:featuredmedia,wp:term`;
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (res.status === 400 && page > 1) break; // past the last page
      if (type === "product" && res.status === 404) break; // no WooCommerce REST route
      if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
      const rows = (await res.json()) as WpRest[];
      out.push(...fromRest(type, rows));
      if (rows.length < 100) break;
    }
  }
  return out;
}
