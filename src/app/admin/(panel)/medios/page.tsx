import type { Metadata } from "next";
import { Flash } from "@/components/admin/flash";
import { MediaDropzone } from "@/components/admin/media-dropzone";
import { EmptyState, PageTitle, Panel } from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { Checkbox, Input } from "@/components/admin/fields";
import { deleteMedia, updateMediaAlt, uploadMedia } from "@/lib/admin/media-actions";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/tours/media";

export const metadata: Metadata = { title: "Medios" };

const PAGE = 48;

/** FR-87: media library with alt text, search and guarded delete. */
export default async function MediaAdmin({ searchParams }: PageProps<"/admin/medios">) {
  const staff = await requireStaff();
  const { ok, error, q: rawQ, sin_alt } = await searchParams;
  const q = typeof rawQ === "string" ? rawQ.trim().slice(0, 100) : "";
  const missingAlt = sin_alt === "1";
  const db = await createClient();
  let query = db
    .from("media")
    .select("id, bucket, path, source_url, alt, width, height, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(PAGE);
  if (q) {
    const term = q.replace(/[%_,()]/g, " ");
    query = query.or(`alt.ilike.%${term}%,path.ilike.%${term}%`);
  }
  if (missingAlt) query = query.or("alt.is.null,alt.eq.");
  const { data: media, count } = await query;
  const ids = (media ?? []).map((m) => m.id);
  const usage = new Map<string, number>();
  await Promise.all(
    ids.map(async (id) => {
      const { data } = await db.rpc("media_usage", { p_media_id: id });
      usage.set(id, data ?? 0);
    }),
  );

  return (
    <>
      <PageTitle description="Fotos de las excursiones y del contenido. Rellena el texto alternativo de cada una.">
        Medios
      </PageTitle>
      <Flash ok={ok} error={error} />
      <Panel title="Subir imagen">
        <form action={uploadMedia} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <MediaDropzone />
          <Input
            label="Texto alternativo"
            name="alt"
            required
            hint="Describe lo que se ve, para quien no puede verla."
          />
          <Button type="submit">Subir</Button>
        </form>
      </Panel>

      <Panel>
        <form className="flex flex-wrap items-end gap-3" role="search">
          <div className="w-72">
            <Input
              label="Buscar"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Texto alternativo o nombre de archivo"
            />
          </div>
          <div className="pb-4">
            <Checkbox
              name="sin_alt"
              value="1"
              defaultChecked={missingAlt}
              label="Solo sin texto alternativo"
            />
          </div>
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
        </form>
        <p className="mt-3 text-sm text-tertiary">
          {count ?? 0} imágenes
          {(count ?? 0) > PAGE ? ` (se muestran las ${PAGE} más recientes)` : ""}.
        </p>
        {(media ?? []).length === 0 && (
          <EmptyState illustration="photos" title="No hay imágenes">
            Sube la primera foto con el formulario de arriba o cambia el filtro.
          </EmptyState>
        )}
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(media ?? []).map((m) => {
            const url = mediaUrl(m);
            const used = usage.get(m.id) ?? 0;
            return (
              <li key={m.id} className="overflow-hidden rounded-xl border border-secondary">
                <div className="aspect-[4/3] bg-secondary">
                  {url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={m.alt ?? ""}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <p className="truncate text-xs text-tertiary" title={m.path}>
                    {m.path.split("/").pop()}
                    {m.width ? ` · ${m.width}×${m.height}` : ""}
                  </p>
                  <form action={updateMediaAlt.bind(null, m.id)} className="space-y-2">
                    <input type="hidden" name="q" value={q} />
                    <Input
                      label="Texto alternativo"
                      name="alt"
                      defaultValue={m.alt ?? ""}
                      error={m.alt ? undefined : "Falta el texto alternativo."}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="submit" size="sm" variant="outline">
                        Guardar
                      </Button>
                      {staff.role === "owner" &&
                        (used > 0 ? (
                          <span className="text-xs text-tertiary">
                            En uso ({used}): no se puede borrar
                          </span>
                        ) : (
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            formAction={deleteMedia.bind(null, m.id)}
                          >
                            Borrar
                          </Button>
                        ))}
                    </div>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </>
  );
}
