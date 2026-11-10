"use client";

import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";
import { cn } from "@/lib/cn";

export type PickerImage = { url: string; alt: string; label: string };

/**
 * Blog/pages editor (FR-83). Tiptap limited to the nodes the public renderer
 * supports; the JSON goes to the server in a hidden field and is sanitised
 * there again before it is stored.
 */
export function RichTextEditor({
  name,
  initial,
  images,
  label,
}: {
  name: string;
  initial: unknown;
  images: PickerImage[];
  label: string;
}) {
  const [json, setJson] = useState(() => JSON.stringify(initial ?? { type: "doc", content: [] }));
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: false,
        link: {
          openOnClick: false,
          autolink: true,
          protocols: ["mailto", "tel"],
          HTMLAttributes: { rel: null, target: null },
        },
      }),
      Image.configure({ inline: false }),
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: (initial as object) ?? undefined,
    editorProps: {
      attributes: {
        class: "rich-text min-h-80 max-w-none px-4 py-3 outline-none",
        "aria-label": label,
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onUpdate: ({ editor }) => setJson(JSON.stringify(editor.getJSON())),
  });

  return (
    <div className="rounded-control border border-border-strong bg-white focus-within:border-blue">
      <input type="hidden" name={name} value={json} />
      {editor ? (
        <Toolbar editor={editor} images={images} />
      ) : (
        <div className="h-11 border-b border-border" />
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor, images }: { editor: Editor; images: PickerImage[] }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      link: e.isActive("link"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      table: e.isActive("table"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const [image, setImage] = useState("");
  const chain = () => editor.chain().focus();

  function setLink() {
    const prev = (editor.getAttributes("link").href as string | undefined) ?? "";
    const href = window.prompt(
      "Enlace (https://…, /ruta-interna, mailto: o tel:). Vacío para quitarlo.",
      prev,
    );
    if (href === null) return;
    if (!href.trim()) chain().extendMarkRange("link").unsetLink().run();
    else chain().extendMarkRange("link").setLink({ href: href.trim() }).run();
  }

  function insertImage() {
    const img = images.find((i) => i.url === image);
    if (!img) return;
    chain().setImage({ src: img.url, alt: img.alt }).run();
    setImage("");
  }

  return (
    <div
      role="toolbar"
      aria-label="Formato"
      className="flex flex-wrap items-center gap-1 border-b border-border bg-surface-alt p-1"
    >
      <Btn
        on={s.h2}
        onClick={() => chain().toggleHeading({ level: 2 }).run()}
        label="Título de sección"
      >
        H2
      </Btn>
      <Btn on={s.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()} label="Subtítulo">
        H3
      </Btn>
      <Sep />
      <Btn on={s.bold} onClick={() => chain().toggleBold().run()} label="Negrita">
        <b>B</b>
      </Btn>
      <Btn on={s.italic} onClick={() => chain().toggleItalic().run()} label="Cursiva">
        <i>I</i>
      </Btn>
      <Btn on={s.link} onClick={setLink} label="Enlace">
        Enlace
      </Btn>
      <Sep />
      <Btn on={s.bullet} onClick={() => chain().toggleBulletList().run()} label="Lista">
        • Lista
      </Btn>
      <Btn on={s.ordered} onClick={() => chain().toggleOrderedList().run()} label="Lista numerada">
        1. Lista
      </Btn>
      <Btn on={s.quote} onClick={() => chain().toggleBlockquote().run()} label="Cita">
        Cita
      </Btn>
      <Sep />
      {s.table ? (
        <>
          <Btn onClick={() => chain().addRowAfter().run()} label="Añadir fila">
            + Fila
          </Btn>
          <Btn onClick={() => chain().addColumnAfter().run()} label="Añadir columna">
            + Col
          </Btn>
          <Btn onClick={() => chain().deleteRow().run()} label="Quitar fila">
            − Fila
          </Btn>
          <Btn onClick={() => chain().deleteTable().run()} label="Quitar tabla">
            Quitar tabla
          </Btn>
        </>
      ) : (
        <Btn
          onClick={() => chain().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()}
          label="Insertar tabla"
        >
          Tabla
        </Btn>
      )}
      <Sep />
      {images.length > 0 && (
        <span className="flex items-center gap-1">
          <label className="sr-only" htmlFor="editor-image">
            Imagen de la biblioteca
          </label>
          <select
            id="editor-image"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="h-8 max-w-48 rounded-control border border-border-strong bg-white px-2 text-sm"
          >
            <option value="">Imagen…</option>
            {images.map((i) => (
              <option key={i.url} value={i.url}>
                {i.label}
              </option>
            ))}
          </select>
          <Btn onClick={insertImage} label="Insertar imagen" disabled={!image}>
            Insertar
          </Btn>
        </span>
      )}
      <Sep />
      <Btn onClick={() => chain().undo().run()} label="Deshacer" disabled={!s.canUndo}>
        ↶
      </Btn>
      <Btn onClick={() => chain().redo().run()} label="Rehacer" disabled={!s.canRedo}>
        ↷
      </Btn>
    </div>
  );
}

function Btn({
  on,
  onClick,
  label,
  disabled,
  children,
}: {
  on?: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on === undefined ? undefined : on}
      aria-label={label}
      title={label}
      className={cn(
        "h-8 min-w-8 rounded-control px-2 text-sm hover:bg-white disabled:opacity-40",
        on && "bg-white font-bold text-blue shadow-float",
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-border-strong" />;
}
