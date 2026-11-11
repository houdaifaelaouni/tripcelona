import Link from "next/link";
import { Panel } from "@/components/admin/ui";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/admin/button";
import { Input, Select, Textarea } from "@/components/admin/fields";
import type { MediaOption } from "@/lib/admin/media-options";

type Values = {
  title: string;
  slug: string;
  content: unknown;
  status: "draft" | "published" | "archived";
  seo_title: string | null;
  seo_description: string | null;
  excerpt?: string | null;
  cover_id?: string | null;
  tags?: string[];
  kind?: string;
};

/** Shared editor for blog posts and pages (FR-83). */
export function ContentForm({
  kind,
  action,
  values,
  media,
  publicPath,
  previewHref,
  readOnly,
  canSetKind,
}: {
  kind: "post" | "page";
  action: (form: FormData) => Promise<void>;
  values: Values;
  media: MediaOption[];
  publicPath: string;
  previewHref: string;
  readOnly?: string;
  /** Pages only, owner only: choose between a normal and a legal page. */
  canSetKind?: boolean;
}) {
  return (
    <form action={action}>
      {readOnly && (
        <p role="note" className="mb-4 rounded-xl border border-secondary bg-primary p-3 text-sm">
          {readOnly}
        </p>
      )}
      <fieldset disabled={Boolean(readOnly)} className="contents">
        <Panel title="Contenido">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Título" name="title" defaultValue={values.title} required />
            <Input
              label="URL"
              name="slug"
              defaultValue={values.slug}
              required
              hint={
                <>
                  Se publica en <code>{publicPath.replace(/[^/]+$/, "")}</code>
                  <b>{values.slug}</b>
                </>
              }
            />
          </div>
          {kind === "page" && canSetKind && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Select
                label="Tipo"
                name="kind"
                defaultValue={values.kind ?? "page"}
                hint="Las páginas legales solo las puede cambiar el propietario."
              >
                <option value="page">Página</option>
                <option value="legal">Página legal</option>
              </Select>
            </div>
          )}
          {kind === "post" && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Textarea
                label="Resumen"
                name="excerpt"
                rows={3}
                defaultValue={values.excerpt ?? ""}
                hint="Se muestra en el listado del blog."
              />
              <div className="space-y-4">
                <Select
                  label="Imagen de portada"
                  name="cover_id"
                  defaultValue={values.cover_id ?? ""}
                >
                  <option value="">Sin portada</option>
                  {media.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Etiquetas"
                  name="tags"
                  defaultValue={(values.tags ?? []).join(", ")}
                  hint="Separadas por comas."
                />
              </div>
            </div>
          )}
          <div className="mt-4">
            <p className="mb-1 text-sm font-semibold" id="editor-label">
              Texto
            </p>
            <RichTextEditor name="content" initial={values.content} images={media} label="Texto" />
          </div>
        </Panel>

        <Panel title="SEO">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Título SEO"
              name="seo_title"
              maxLength={70}
              defaultValue={values.seo_title ?? ""}
              hint="Hasta 70 caracteres. Vacío = el título."
            />
            <Textarea
              label="Descripción SEO"
              name="seo_description"
              maxLength={170}
              rows={2}
              defaultValue={values.seo_description ?? ""}
              hint="Hasta 170 caracteres. Aparece en Google."
            />
          </div>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-48">
              <Select label="Estado" name="status" defaultValue={values.status}>
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="archived">Archivado</option>
              </Select>
            </div>
            <Button type="submit">Guardar</Button>
            <Link
              href={previewHref}
              className="text-sm text-brand-secondary hover:underline"
              target="_blank"
            >
              Vista previa (guarda antes) ↗
            </Link>
            {values.status === "published" && (
              <Link
                href={publicPath}
                className="text-sm text-brand-secondary hover:underline"
                target="_blank"
              >
                Ver en la web ↗
              </Link>
            )}
          </div>
        </Panel>
      </fieldset>
    </form>
  );
}
