import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
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
import { contentMediaPath } from "@/lib/content/images";
import { docText, readingMinutes, safeHref, sanitizeDoc } from "@/lib/content/rich-text";
import { parseWxr } from "@/lib/content/wordpress";

const urlMap = urlMapFromCsv(readFileSync("migration/urls.csv", "utf8"));
const rewrite = legacyLinkRewriter(urlMap);
const wxr = parseWxr(readFileSync("tests/fixtures/wordpress-export.xml", "utf8"));

describe("sanitizeDoc", () => {
  it("drops unknown nodes, unsafe links and images", () => {
    const doc = sanitizeDoc({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "hola",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
        { type: "iframe", attrs: { src: "https://evil.example" } },
        { type: "image", attrs: { src: "http://insecure.example/a.jpg", alt: "x" } },
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Título" }] },
      ],
    });
    expect(doc.content).toEqual([
      { type: "paragraph", content: [{ type: "text", text: "hola" }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Título" }] },
    ]);
  });

  it("accepts JSON strings and rejects garbage", () => {
    expect(sanitizeDoc("not json")).toEqual({ type: "doc", content: [] });
    expect(
      sanitizeDoc('{"type":"doc","content":[{"type":"horizontalRule"}]}').content,
    ).toHaveLength(1);
  });

  it("only allows safe hrefs", () => {
    expect(safeHref("/blog/x")).toBe("/blog/x");
    expect(safeHref("//evil.example")).toBeNull();
    expect(safeHref("mailto:a@b.es")).toBe("mailto:a@b.es");
    expect(safeHref("data:text/html,x")).toBeNull();
  });
});

describe("legacy links", () => {
  it("maps tours, posts and pages to new paths", () => {
    expect(
      rewrite(
        "https://tripcelona.com/product/la-magia-rural-de-cataluna-escapada-a-rupit-y-tavertet/",
      ),
    ).toBe("/excursiones/la-magia-rural-de-cataluna-escapada-a-rupit-y-tavertet");
    expect(rewrite("https://tripcelona.com/rupit-y-tavertet-pueblos-con-encanto/")).toBe(
      "/blog/rupit-y-tavertet-pueblos-con-encanto",
    );
    expect(rewrite("https://tripcelona.com/politica-de-devoluciones/")).toBe(
      "/politica-de-devoluciones",
    );
    expect(rewrite("/ofertas-de-viajes/#top")).toBe("/ofertas-de-viajes#top");
    expect(rewrite("https://www.aepd.es/")).toBe("https://www.aepd.es/");
    expect(rewrite("https://tripcelona.com/sin-mapa/")).toBe("/sin-mapa");
  });
});

describe("htmlToDoc", () => {
  const post = wxr.find((i) => i.slug === "entrada-de-prueba")!;
  const doc = htmlToDoc(post.html, rewrite);

  it("keeps text, headings, lists, tables and images; drops scripts and bad links", () => {
    const types = doc.content.map((b) => b.type);
    expect(types).toEqual(["paragraph", "heading", "bulletList", "image", "table", "paragraph"]);
    const text = docText(doc);
    expect(text).toContain("Primer párrafo con negrita y un enlace.");
    expect(text).not.toContain("alert");
    expect(JSON.stringify(doc)).not.toContain("javascript:");
    expect(JSON.stringify(doc)).toContain(
      '"href":"/excursiones/la-magia-rural-de-cataluna-escapada-a-rupit-y-tavertet"',
    );
    expect(JSON.stringify(doc)).toContain('"href":"/ofertas-de-viajes#top"');
  });

  it("uses full-size images and keeps alt and caption", () => {
    expect(docImages(doc)).toEqual([
      {
        src: "https://tripcelona.com/wp-content/uploads/2025/11/foto-prueba.jpg",
        alt: "Foto de prueba",
      },
    ]);
    const img = doc.content.find((b) => b.type === "image");
    expect(img).toMatchObject({ attrs: { title: "Pie de foto" } });
  });

  it("keeps table header cells", () => {
    const table = doc.content.find((b) => b.type === "table");
    expect(table && table.type === "table" && table.content[0].content[0].type).toBe("tableHeader");
  });

  it("flattens page-builder wrappers and demotes h1", () => {
    const legal = htmlToDoc(wxr.find((i) => i.slug === "aviso-legal")!.html, rewrite);
    expect(legal.content.map((b) => b.type)).toEqual(["heading", "paragraph", "orderedList"]);
    expect(legal.content[0]).toMatchObject({ attrs: { level: 2 } });
  });

  it("merges text across inline tags and keeps marks", () => {
    const d = htmlToDoc("<p>Uno <span>dos</span> <b>tres</b><br>cuatro</p>");
    expect(d.content[0]).toEqual({
      type: "paragraph",
      content: [
        { type: "text", text: "Uno dos " },
        { type: "text", text: "tres", marks: [{ type: "bold" }] },
        { type: "hardBreak" },
        { type: "text", text: "cuatro" },
      ],
    });
  });

  it("estimates reading time", () => {
    expect(readingMinutes(doc)).toBe(1);
  });
});

describe("WXR parsing", () => {
  it("reads posts and pages with cover, tags and usable SEO only", () => {
    const post = wxr.find((i) => i.slug === "entrada-de-prueba")!;
    expect(post).toMatchObject({
      type: "post",
      title: "Entrada de prueba & guía",
      status: "publish",
      date: "2026-10-26T16:43:50.000Z",
      coverUrl: "https://tripcelona.com/wp-content/uploads/2025/11/portada-prueba.jpg",
      seoTitle: null,
      seoDescription: "Descripción SEO de prueba.",
      excerpt: "Resumen de prueba.",
      tags: ["Prueba"],
    });
    expect(wxr.filter((i) => i.type === "page").map((i) => i.slug)).toEqual([
      "aviso-legal",
      "preguntas-frecuentes",
      "contactanos",
    ]);
  });
});

describe("FAQ extraction", () => {
  it("reads Elementor accordions", () => {
    const faqs = extractFaqs(wxr.find((i) => i.slug === "preguntas-frecuentes")!.html);
    expect(faqs).toEqual([
      { question: "¿Pregunta uno?", answer: "Respuesta uno.\n\nSegunda línea." },
      { question: "¿Pregunta dos?", answer: "Respuesta dos." },
    ]);
  });

  it("reads Elementor toggle fallback HTML, bare-text answers included, and stops at the next section", () => {
    const html = `<h1>FAQ</h1>
      <a href="#e1" aria-controls="e1">¿Uno?</a> Respuesta suelta.<h3> </h3>
      <a href="#e2" aria-controls="e2">¿Dos?</a><ul><li>A</li><li>B</li></ul>
      <h2>Otra sección</h2><p>No es una respuesta.</p>`;
    expect(extractFaqs(html)).toEqual([
      { question: "¿Uno?", answer: "Respuesta suelta." },
      { question: "¿Dos?", answer: "• A\n\n• B" },
    ]);
  });

  it("reads Rank Math blocks and details", () => {
    expect(
      extractFaqs(
        '<div class="rank-math-list-item"><h3 class="rank-math-question">¿P?</h3><div class="rank-math-answer"><p>R</p></div></div>',
      ),
    ).toEqual([{ question: "¿P?", answer: "R" }]);
    expect(extractFaqs("<details><summary>¿Q?</summary><p>A</p></details>")).toEqual([
      { question: "¿Q?", answer: "A" },
    ]);
  });
});

describe("legacy clean-up", () => {
  it("drops breadcrumbs, a repeated h1, jump links and plugin shortcodes, keeping identity tokens", () => {
    const { html, removedShortcodes } = cleanLegacyHtml(
      '<ul><li><a href="#">Home</a></li><li></li></ul><h1>Aviso legal</h1><a href="#x">Ir</a><p>Titular: [tripola dato="titular"]</p>[cmplz-document type="x"]',
      "Aviso legal",
    );
    expect(html).toBe('Ir<p>Titular: [tripola dato="titular"]</p>');
    expect(removedShortcodes).toEqual(['[cmplz-document type="x"]']);
  });

  it("removes WooCommerce booking facts from tour copy", () => {
    expect(
      stripProductFacts('<div class="tripcelona-detalles"><li>Precio</li></div><p>Texto</p>'),
    ).toBe("<p>Texto</p>");
  });
});

describe("content media paths", () => {
  it("strips WordPress size suffixes and stores under content/", () => {
    expect(fullSize("https://x/a/b-1024x683.jpg")).toBe("https://x/a/b.jpg");
    expect(contentMediaPath("https://tripcelona.com/wp-content/uploads/2025/11/b.jpg")).toBe(
      "content/b.jpg",
    );
  });
});
