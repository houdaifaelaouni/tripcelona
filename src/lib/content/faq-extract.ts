/**
 * Pulls question/answer pairs out of a legacy FAQ page (US-31). Supports the
 * markup WordPress FAQ widgets produce: Rank Math and Yoast FAQ blocks,
 * Elementor accordion/toggle (classic and nested) and plain <details>.
 */
import { NodeType, parse, type HTMLElement, type Node } from "node-html-parser";

export type ExtractedFaq = { question: string; answer: string };

const clean = (s: string) =>
  s
    .replace(/[ \t\r\f\v]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .trim();

/** Block-aware text: paragraphs and list items become separate lines. */
function textOf(el: HTMLElement | null | undefined): string {
  if (!el) return "";
  el.querySelectorAll("script, style, noscript, svg, button").forEach((n) => n.remove());
  el.querySelectorAll("br").forEach((n) => n.replaceWith("\n"));
  el.querySelectorAll("p, li, div, h2, h3, h4, h5, h6").forEach((n) => {
    n.insertAdjacentHTML("afterend", "\n\n");
  });
  el.querySelectorAll("li").forEach((n) => n.insertAdjacentHTML("afterbegin", "• "));
  return clean(el.text).replace(/\n{3,}/g, "\n\n");
}

function pairs(root: HTMLElement, item: string, q: string, a: string): ExtractedFaq[] {
  return root
    .querySelectorAll(item)
    .map((el) => ({ question: textOf(el.querySelector(q)), answer: textOf(el.querySelector(a)) }))
    .filter((f) => f.question && f.answer);
}

export function extractFaqs(html: string): ExtractedFaq[] {
  const root = parse(html);
  const strategies: (() => ExtractedFaq[])[] = [
    () => pairs(root, ".rank-math-list-item", ".rank-math-question", ".rank-math-answer"),
    () => pairs(root, ".schema-faq-section", ".schema-faq-question", ".schema-faq-answer"),
    () =>
      pairs(
        root,
        ".elementor-accordion-item, .elementor-toggle-item",
        ".elementor-tab-title",
        ".elementor-tab-content",
      ),
    () =>
      root.querySelectorAll("details").map((d) => {
        const summary = d.querySelector("summary");
        const question = textOf(summary);
        summary?.remove();
        return { question, answer: textOf(d) };
      }),
  ];
  // Elementor "toggle" fallback HTML: <a aria-controls> question, then the
  // answer as whatever follows (paragraphs, lists or bare text) until the next one.
  strategies.push(() => {
    const out: { question: string; answer: string }[] = [];
    let buf: string[] | null = null;
    let question = "";
    const flush = () => {
      if (buf) out.push({ question, answer: clean(buf.join("")).replace(/\n{3,}/g, "\n\n") });
    };
    const BREAKS = new Set([
      "p",
      "ul",
      "ol",
      "li",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "div",
      "table",
      "tr",
    ]);
    const walk = (node: Node) => {
      if (node.nodeType === NodeType.TEXT_NODE) {
        buf?.push(node.text.replace(/\s+/g, " "));
        return;
      }
      if (node.nodeType !== NodeType.ELEMENT_NODE) return;
      const el = node as HTMLElement;
      const tag = el.rawTagName?.toLowerCase() ?? "";
      if (["script", "style", "svg", "button"].includes(tag)) return;
      if (tag === "a" && el.getAttribute("aria-controls")) {
        flush();
        question = clean(el.text);
        buf = [];
        return;
      }
      if ((tag === "h1" || tag === "h2") && buf) {
        // A section heading ends the FAQ list (the page continues with other blocks).
        flush();
        buf = null;
        return;
      }
      if (tag === "br") {
        buf?.push("\n");
        return;
      }
      const brk = BREAKS.has(tag);
      if (brk) buf?.push("\n\n");
      if (tag === "li") buf?.push("• ");
      el.childNodes.forEach(walk);
      if (brk) buf?.push("\n\n");
    };
    walk(root);
    flush();
    return out;
  });
  for (const run of strategies) {
    const found = run().filter((f) => f.question && f.answer);
    if (found.length) return dedupe(found);
  }
  return [];
}

function dedupe(list: ExtractedFaq[]): ExtractedFaq[] {
  const seen = new Set<string>();
  return list.filter((f) => {
    const key = f.question.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
