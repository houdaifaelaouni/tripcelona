/**
 * Rich text model for posts and pages (FR-83): a strict subset of Tiptap /
 * ProseMirror JSON. Everything that enters the database goes through
 * `sanitizeDoc`, whether it comes from the admin editor or the legacy import,
 * so the public renderer only ever sees known nodes, marks and safe URLs.
 */

export type Mark =
  | { type: "bold" | "italic" | "underline" | "strike" | "code" }
  | { type: "link"; attrs: { href: string } };

export type TextNode = { type: "text"; text: string; marks?: Mark[] };

export type InlineNode = TextNode | { type: "hardBreak" };

export type BlockNode =
  | { type: "paragraph"; content?: InlineNode[] }
  | { type: "heading"; attrs: { level: 2 | 3 | 4 }; content?: InlineNode[] }
  | { type: "bulletList"; content: ListItem[] }
  | { type: "orderedList"; attrs?: { start?: number }; content: ListItem[] }
  | { type: "blockquote"; content: BlockNode[] }
  | { type: "horizontalRule" }
  | { type: "image"; attrs: { src: string; alt: string; title?: string | null } }
  | { type: "table"; content: TableRow[] };

export type ListItem = { type: "listItem"; content: BlockNode[] };
export type TableRow = { type: "tableRow"; content: TableCell[] };
export type TableCell = {
  type: "tableHeader" | "tableCell";
  attrs?: { colspan?: number; rowspan?: number };
  content: BlockNode[];
};

export type RichDoc = { type: "doc"; content: BlockNode[] };

export const emptyDoc = (): RichDoc => ({ type: "doc", content: [] });

const SIMPLE_MARKS = new Set(["bold", "italic", "underline", "strike", "code"]);

/** Links: site-relative, in-page, https/http, mailto and tel. Nothing else. */
export function safeHref(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const href = raw.trim();
  if (!href) return null;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (href.startsWith("#")) return href;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) {
    try {
      if (/^https?:/i.test(href)) new URL(href);
      return href;
    } catch {
      return null;
    }
  }
  return null;
}

/** Images: https or site-relative only. */
export function safeSrc(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const src = raw.trim();
  if (src.startsWith("/") && !src.startsWith("//")) return src;
  try {
    return new URL(src).protocol === "https:" ? src : null;
  } catch {
    return null;
  }
}

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function marks(raw: unknown): Mark[] | undefined {
  const out: Mark[] = [];
  for (const m of arr(raw)) {
    if (!isObj(m) || typeof m.type !== "string") continue;
    if (SIMPLE_MARKS.has(m.type)) out.push({ type: m.type as "bold" });
    else if (m.type === "link") {
      const href = safeHref(isObj(m.attrs) ? m.attrs.href : null);
      if (href) out.push({ type: "link", attrs: { href } });
    }
  }
  return out.length ? out : undefined;
}

function inline(raw: unknown): InlineNode[] {
  const out: InlineNode[] = [];
  for (const n of arr(raw)) {
    if (!isObj(n)) continue;
    if (n.type === "text" && typeof n.text === "string" && n.text.length > 0) {
      const m = marks(n.marks);
      out.push(m ? { type: "text", text: n.text, marks: m } : { type: "text", text: n.text });
    } else if (n.type === "hardBreak") out.push({ type: "hardBreak" });
  }
  return out;
}

function blocks(raw: unknown, depth = 0): BlockNode[] {
  if (depth > 12) return [];
  const out: BlockNode[] = [];
  for (const n of arr(raw)) {
    const b = block(n, depth);
    if (b) out.push(b);
  }
  return out;
}

function listItems(raw: unknown, depth: number): ListItem[] {
  return arr(raw).flatMap((li) =>
    isObj(li) && li.type === "listItem"
      ? [{ type: "listItem" as const, content: blocks(li.content, depth + 1) }]
      : [],
  );
}

function span(v: unknown): number | undefined {
  return typeof v === "number" && Number.isInteger(v) && v > 1 && v <= 20 ? v : undefined;
}

function block(n: unknown, depth: number): BlockNode | null {
  if (!isObj(n)) return null;
  const attrs = isObj(n.attrs) ? n.attrs : {};
  switch (n.type) {
    case "paragraph": {
      const content = inline(n.content);
      return content.length ? { type: "paragraph", content } : { type: "paragraph" };
    }
    case "heading": {
      const raw = Number(attrs.level);
      const level = (raw <= 2 ? 2 : raw >= 4 ? 4 : 3) as 2 | 3 | 4;
      return { type: "heading", attrs: { level }, content: inline(n.content) };
    }
    case "bulletList": {
      const content = listItems(n.content, depth);
      return content.length ? { type: "bulletList", content } : null;
    }
    case "orderedList": {
      const content = listItems(n.content, depth);
      const start = Number(attrs.start);
      if (!content.length) return null;
      return Number.isInteger(start) && start > 1
        ? { type: "orderedList", attrs: { start }, content }
        : { type: "orderedList", content };
    }
    case "blockquote": {
      const content = blocks(n.content, depth + 1);
      return content.length ? { type: "blockquote", content } : null;
    }
    case "horizontalRule":
      return { type: "horizontalRule" };
    case "image": {
      const src = safeSrc(attrs.src);
      if (!src) return null;
      const alt = typeof attrs.alt === "string" ? attrs.alt.slice(0, 300) : "";
      const title = typeof attrs.title === "string" ? attrs.title.slice(0, 300) : null;
      return { type: "image", attrs: { src, alt, title } };
    }
    case "table": {
      const rows: TableRow[] = arr(n.content).flatMap((r) => {
        if (!isObj(r) || r.type !== "tableRow") return [];
        const cells: TableCell[] = arr(r.content).flatMap((c) => {
          if (!isObj(c) || (c.type !== "tableHeader" && c.type !== "tableCell")) return [];
          const ca = isObj(c.attrs) ? c.attrs : {};
          const colspan = span(ca.colspan);
          const rowspan = span(ca.rowspan);
          return [
            {
              type: c.type,
              ...(colspan || rowspan ? { attrs: { colspan, rowspan } } : {}),
              content: blocks(c.content, depth + 1),
            },
          ];
        });
        return cells.length ? [{ type: "tableRow" as const, content: cells }] : [];
      });
      return rows.length ? { type: "table", content: rows } : null;
    }
    default:
      return null;
  }
}

/** Parses untrusted JSON (string or object) into a safe RichDoc. */
export function sanitizeDoc(raw: unknown): RichDoc {
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return emptyDoc();
    }
  }
  if (!isObj(value) || value.type !== "doc") return emptyDoc();
  return { type: "doc", content: blocks(value.content) };
}

/** Plain text, for excerpts, reading time and search. */
export function docText(doc: RichDoc): string {
  const parts: string[] = [];
  const walk = (nodes: unknown[]) => {
    for (const n of nodes) {
      if (!isObj(n)) continue;
      if (n.type === "text" && typeof n.text === "string") parts.push(n.text);
      else if (n.type === "hardBreak") parts.push(" ");
      if (Array.isArray(n.content)) {
        walk(n.content);
        if (n.type !== "text") parts.push(" ");
      }
    }
  };
  walk(doc.content);
  return parts.join("").replace(/\s+/g, " ").trim();
}

/** Spanish reading speed, roughly 200 words per minute. */
export function readingMinutes(doc: RichDoc): number {
  const words = docText(doc).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** True when the doc has no visible text and no image. */
export function isEmptyDoc(doc: RichDoc): boolean {
  return !docText(doc) && !JSON.stringify(doc).includes('"type":"image"');
}
