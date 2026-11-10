import Link from "next/link";
import type { ReactNode } from "react";
import { resolveContentImage } from "@/lib/content/images";
import type { BlockNode, InlineNode, Mark, RichDoc } from "@/lib/content/rich-text";

type Tokens = Record<string, string>;

/**
 * Renders a sanitised RichDoc as React elements (no innerHTML anywhere).
 * Typography comes from the `.rich-text` rules in globals.css.
 * `tokens` fills `[tripola dato="x"]` placeholders kept from the legacy legal
 * pages (owner identity data edited in Ajustes).
 */
export function RichText({
  doc,
  className,
  tokens = {},
}: {
  doc: RichDoc;
  className?: string;
  tokens?: Tokens;
}) {
  return (
    <div className={className ? `rich-text ${className}` : "rich-text"}>
      {renderBlocks(doc.content, tokens)}
    </div>
  );
}

function fill(text: string, tokens: Tokens): string {
  return text.replace(
    /\[tripola dato="([a-z_]+)"\]/g,
    (_, key: string) => tokens[key] ?? "(pendiente)",
  );
}

function renderBlocks(nodes: BlockNode[], t: Tokens): ReactNode[] {
  return nodes.map((n, i) => renderBlock(n, i, t));
}

function renderBlock(node: BlockNode, key: number, t: Tokens): ReactNode {
  switch (node.type) {
    case "paragraph":
      return <p key={key}>{renderInline(node.content ?? [], t)}</p>;
    case "heading": {
      const Tag = `h${node.attrs.level}` as "h2" | "h3" | "h4";
      return <Tag key={key}>{renderInline(node.content ?? [], t)}</Tag>;
    }
    case "bulletList":
      return (
        <ul key={key}>
          {node.content.map((li, j) => (
            <li key={j}>{renderBlocks(li.content, t)}</li>
          ))}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key} start={node.attrs?.start}>
          {node.content.map((li, j) => (
            <li key={j}>{renderBlocks(li.content, t)}</li>
          ))}
        </ol>
      );
    case "blockquote":
      return <blockquote key={key}>{renderBlocks(node.content, t)}</blockquote>;
    case "horizontalRule":
      return <hr key={key} />;
    case "image":
      return (
        <figure key={key}>
          {/* Arbitrary editor-chosen hosts, so a plain img rather than next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveContentImage(node.attrs.src)}
            alt={node.attrs.alt}
            loading="lazy"
            decoding="async"
          />
          {node.attrs.title && <figcaption>{node.attrs.title}</figcaption>}
        </figure>
      );
    case "table":
      return (
        <div key={key} className="rich-table">
          <table>
            <tbody>
              {node.content.map((row, r) => (
                <tr key={r}>
                  {row.content.map((cell, c) => {
                    const Cell = cell.type === "tableHeader" ? "th" : "td";
                    return (
                      <Cell key={c} colSpan={cell.attrs?.colspan} rowSpan={cell.attrs?.rowspan}>
                        {renderBlocks(cell.content, t)}
                      </Cell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

function renderInline(nodes: InlineNode[], t: Tokens): ReactNode[] {
  return nodes.map((n, i) =>
    n.type === "hardBreak" ? (
      <br key={i} />
    ) : (
      <span key={i}>{applyMarks(fill(n.text, t), n.marks ?? [])}</span>
    ),
  );
}

function applyMarks(text: string, marks: Mark[]): ReactNode {
  return marks.reduceRight<ReactNode>((child, mark) => {
    switch (mark.type) {
      case "bold":
        return <strong>{child}</strong>;
      case "italic":
        return <em>{child}</em>;
      case "underline":
        return <u>{child}</u>;
      case "strike":
        return <s>{child}</s>;
      case "code":
        return <code>{child}</code>;
      case "link": {
        const href = mark.attrs.href;
        if (href.startsWith("/")) return <Link href={href}>{child}</Link>;
        const external = /^https?:/i.test(href);
        return (
          <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {child}
          </a>
        );
      }
    }
  }, text);
}
