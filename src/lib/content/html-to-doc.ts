/**
 * Legacy WordPress HTML -> RichDoc (US-31). Runs once, at import time:
 * only known structure survives (headings, paragraphs, lists, tables, quotes,
 * images, links and basic emphasis); builder markup (Elementor divs, scripts,
 * forms, inline styles) is dropped. The result still goes through
 * `sanitizeDoc` before it is stored.
 */
import { NodeType, parse, type HTMLElement, type Node } from "node-html-parser";
import {
  sanitizeDoc,
  safeHref,
  type BlockNode,
  type InlineNode,
  type ListItem,
  type Mark,
  type RichDoc,
  type TableCell,
  type TableRow,
} from "./rich-text";

export type LinkRewriter = (href: string) => string;

const DROP = new Set([
  "script",
  "style",
  "noscript",
  "form",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "svg",
  "iframe",
  "nav",
  "template",
  "link",
  "meta",
  "head",
  "video",
  "audio",
  "object",
  "embed",
  "canvas",
]);

const BLOCK = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "hr",
  "figure",
  "table",
  "div",
  "section",
  "article",
  "main",
  "header",
  "footer",
  "aside",
  "dl",
  "dt",
  "dd",
  "details",
  "summary",
  "pre",
]);

const MARK_TAGS: Record<string, Mark["type"]> = {
  strong: "bold",
  b: "bold",
  em: "italic",
  i: "italic",
  u: "underline",
  s: "strike",
  del: "strike",
  strike: "strike",
  code: "code",
};

const tag = (n: Node) =>
  n.nodeType === NodeType.ELEMENT_NODE ? ((n as HTMLElement).rawTagName?.toLowerCase() ?? "") : "";

/** Accumulates inline runs and flushes them as paragraphs between blocks. */
class Builder {
  blocks: BlockNode[] = [];
  private run: InlineNode[] = [];

  constructor(private readonly rewrite: LinkRewriter) {}

  text(raw: string, marks: Mark[]) {
    const text = raw.replace(/\s+/g, " ");
    if (!text) return;
    const last = this.run.at(-1);
    if (last?.type === "text" && sameMarks(last.marks ?? [], marks)) {
      last.text += text;
      return;
    }
    this.run.push(
      marks.length ? { type: "text", text, marks: [...marks] } : { type: "text", text },
    );
  }

  hardBreak() {
    this.run.push({ type: "hardBreak" });
  }

  flush() {
    const content = trimInline(this.run);
    this.run = [];
    if (content.length) this.blocks.push({ type: "paragraph", content });
  }

  block(b: BlockNode | null) {
    this.flush();
    if (b) this.blocks.push(b);
  }

  /** Walks children of a block-level container. */
  children(el: HTMLElement, marks: Mark[] = []) {
    for (const child of el.childNodes) this.node(child, marks);
  }

  node(n: Node, marks: Mark[]) {
    if (n.nodeType === NodeType.TEXT_NODE) {
      this.text(n.text, marks);
      return;
    }
    if (n.nodeType !== NodeType.ELEMENT_NODE) return;
    const el = n as HTMLElement;
    const name = tag(el);
    if (DROP.has(name) || el.getAttribute("aria-hidden") === "true") return;

    if (name === "br") return this.hardBreak();
    if (name === "img") return this.block(image(el));
    if (name in MARK_TAGS) return this.children(el, [...marks, { type: MARK_TAGS[name] } as Mark]);
    if (name === "a") {
      const href = safeHref(this.rewrite(el.getAttribute("href") ?? ""));
      const linkMarks = href
        ? [...marks.filter((m) => m.type !== "link"), { type: "link" as const, attrs: { href } }]
        : marks;
      return this.children(el, linkMarks);
    }
    if (!BLOCK.has(name)) return this.children(el, marks); // span, font, small, ...

    switch (name) {
      case "p":
      case "dt":
      case "dd":
      case "summary":
      case "pre": {
        this.flush();
        this.children(el, marks);
        this.flush();
        return;
      }
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6": {
        const level = Math.min(Math.max(Number(name[1]), 2), 4) as 2 | 3 | 4;
        const inner = this.sub(el);
        const content = trimInline(
          inner.flatMap((b) => (b.type === "paragraph" ? (b.content ?? []) : [])),
        );
        this.block(content.length ? { type: "heading", attrs: { level }, content } : null);
        // Images inside headings (icon widgets) are kept after the heading.
        inner.filter((b) => b.type === "image").forEach((b) => this.block(b));
        return;
      }
      case "ul":
      case "ol": {
        const items: ListItem[] = el.childNodes
          .filter((c) => tag(c) === "li")
          .map((li) => ({ type: "listItem" as const, content: this.sub(li as HTMLElement) }))
          .filter((li) => li.content.length > 0);
        if (!items.length) return this.flush();
        const start = Number(el.getAttribute("start"));
        this.block(
          name === "ul"
            ? { type: "bulletList", content: items }
            : start > 1
              ? { type: "orderedList", attrs: { start }, content: items }
              : { type: "orderedList", content: items },
        );
        return;
      }
      case "blockquote": {
        const content = this.sub(el);
        this.block(content.length ? { type: "blockquote", content } : null);
        return;
      }
      case "hr":
        return this.block({ type: "horizontalRule" });
      case "figure": {
        const img = el.querySelector("img");
        const caption = el.querySelector("figcaption")?.text.replace(/\s+/g, " ").trim();
        if (img && !el.querySelector("table")) {
          const b = image(img);
          if (b && b.type === "image" && caption) b.attrs.title = caption;
          return this.block(b);
        }
        this.flush();
        this.children(el, marks);
        this.flush();
        return;
      }
      case "table":
        return this.block(this.table(el));
      default: {
        // Transparent containers (div, section, details, ...).
        this.flush();
        this.children(el, marks);
        this.flush();
      }
    }
  }

  /** Converts an element's children into their own block list. */
  sub(el: HTMLElement): BlockNode[] {
    const b = new Builder(this.rewrite);
    b.children(el);
    b.flush();
    return b.blocks;
  }

  table(el: HTMLElement): BlockNode | null {
    const rows: TableRow[] = el.querySelectorAll("tr").map((tr) => ({
      type: "tableRow" as const,
      content: tr.childNodes
        .filter((c) => tag(c) === "td" || tag(c) === "th")
        .map((c) => {
          const cell = c as HTMLElement;
          const colspan = Number(cell.getAttribute("colspan")) || undefined;
          const rowspan = Number(cell.getAttribute("rowspan")) || undefined;
          const content = this.sub(cell);
          return {
            type: tag(c) === "th" ? "tableHeader" : "tableCell",
            ...((colspan && colspan > 1) || (rowspan && rowspan > 1)
              ? { attrs: { colspan, rowspan } }
              : {}),
            content: content.length ? content : [{ type: "paragraph" }],
          } as TableCell;
        }),
    }));
    const kept = rows.filter((r) => r.content.length > 0);
    return kept.length ? { type: "table", content: kept } : null;
  }
}

function image(el: HTMLElement): BlockNode | null {
  // Lazy-loading plugins keep the real file in data-src / data-lazy-src.
  const src =
    el.getAttribute("data-src") ?? el.getAttribute("data-lazy-src") ?? el.getAttribute("src") ?? "";
  if (!src || src.startsWith("data:")) return null;
  return {
    type: "image",
    attrs: { src: fullSize(src), alt: (el.getAttribute("alt") ?? "").trim(), title: null },
  };
}

/** WordPress thumbnails (foo-1024x683.jpg) -> original (foo.jpg). */
export function fullSize(src: string): string {
  return src.replace(/-\d{2,5}x\d{2,5}(?=\.(jpe?g|png|webp|gif|avif)(\?|$))/i, "");
}

function sameMarks(a: Mark[], b: Mark[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function trimInline(run: InlineNode[]): InlineNode[] {
  const out = [...run];
  while (out[0]?.type === "hardBreak") out.shift();
  while (out.at(-1)?.type === "hardBreak") out.pop();
  const first = out[0];
  if (first?.type === "text") first.text = first.text.replace(/^\s+/, "");
  const last = out.at(-1);
  if (last?.type === "text") last.text = last.text.replace(/\s+$/, "");
  const cleaned = out.filter((n) => n.type !== "text" || n.text.length > 0);
  return cleaned.some((n) => n.type === "text" && n.text.trim()) ? cleaned : [];
}

export function htmlToDoc(html: string, rewrite: LinkRewriter = (h) => h): RichDoc {
  const root = parse(html, { comment: false, blockTextElements: { pre: true } });
  const b = new Builder(rewrite);
  b.children(root);
  b.flush();
  return sanitizeDoc({ type: "doc", content: b.blocks });
}

/** Every image src in a doc (for media registration). */
export function docImages(doc: RichDoc): { src: string; alt: string }[] {
  const out: { src: string; alt: string }[] = [];
  const walk = (nodes: unknown[]) => {
    for (const n of nodes as {
      type?: string;
      attrs?: { src?: string; alt?: string };
      content?: unknown[];
    }[]) {
      if (n.type === "image" && n.attrs?.src)
        out.push({ src: n.attrs.src, alt: n.attrs.alt ?? "" });
      if (Array.isArray(n.content)) walk(n.content);
    }
  };
  walk(doc.content);
  return out;
}

/**
 * Builds the link rewriter from migration/urls.csv: legacy absolute or
 * relative URLs become new-site paths; unknown internal paths lose the
 * trailing slash; external links are untouched.
 */
export function legacyLinkRewriter(
  map: Map<string, string>,
  host = "tripcelona.com",
): LinkRewriter {
  return (raw) => {
    const href = raw.trim();
    if (!href || href.startsWith("#") || /^(mailto|tel):/i.test(href)) return href;
    let url: URL;
    try {
      url = new URL(href, `https://${host}/`);
    } catch {
      return href;
    }
    const isInternal = url.hostname === host || url.hostname === `www.${host}`;
    if (!isInternal) return href;
    if (url.pathname.startsWith("/wp-content/")) return url.toString();
    const path =
      url.pathname.endsWith("/") && url.pathname !== "/" ? url.pathname : `${url.pathname}/`;
    const mapped = map.get(path) ?? map.get(url.pathname);
    const target = mapped ?? (url.pathname.replace(/\/+$/, "") || "/");
    return `${target}${url.search}${url.hash}`;
  };
}

/** Parses urls.csv rows into old-path -> new-path (keep and 301 rows only). */
export function urlMapFromCsv(csv: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const header = lines.shift()?.split(",") ?? [];
  const col = (name: string) => header.indexOf(name);
  for (const line of lines) {
    const cells = splitCsvLine(line);
    const oldUrl = cells[col("old_url")];
    const newPath = cells[col("new_path")];
    const action = cells[col("action")];
    if (!oldUrl || !newPath || (action !== "keep" && action !== "301") || oldUrl.includes("*"))
      continue;
    try {
      map.set(new URL(oldUrl).pathname, newPath);
    } catch {
      /* not a URL row */
    }
  }
  return map;
}

export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/** Shortcodes resolved by the new site (legal identity data from Ajustes). */
export const KEPT_SHORTCODE = /\[tripola dato="([a-z_]+)"\]/g;

/**
 * WordPress-specific clean-up before conversion: removes the theme's
 * breadcrumb list, a first <h1> that repeats the title (pages render their
 * own), plugin shortcodes the new site replaces, and in-page jump links.
 * Returns the removed shortcodes so the import report can list them.
 */
export function cleanLegacyHtml(
  html: string,
  title: string,
): { html: string; removedShortcodes: string[] } {
  const root = parse(html, { comment: false });
  const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const crumbWords = new Set(["", "home", "inicio", "bienvenido", norm(title)]);

  const firstUl = root.querySelector("ul");
  const firstH = root.querySelector("h1, h2");
  if (firstUl && firstH && html.indexOf(firstUl.toString()) < html.indexOf(firstH.toString())) {
    const items = firstUl.querySelectorAll("li").map((li) => norm(li.text));
    if (items.length && items.every((t) => crumbWords.has(t))) firstUl.remove();
  }
  const h1 = root.querySelector("h1");
  if (h1 && norm(h1.text) === norm(title)) h1.remove();
  root.querySelectorAll('a[href^="#"]').forEach((a) => a.replaceWith(a.innerHTML));

  const removed: string[] = [];
  const out = root.toString().replace(/\[\/?[a-zA-Z_][\w-]*(?:\s[^\]]*)?\]/g, (sc) => {
    if (/^\[tripola dato="[a-z_]+"\]$/.test(sc)) return sc;
    removed.push(sc);
    return "";
  });
  return { html: out, removedShortcodes: removed };
}

/** Drops WooCommerce "booking facts" boxes: dates and prices now come from the database. */
export function stripProductFacts(html: string): string {
  const root = parse(html, { comment: false });
  root.querySelectorAll(".tripcelona-detalles, .tc-booking-facts").forEach((n) => n.remove());
  return root.toString();
}
