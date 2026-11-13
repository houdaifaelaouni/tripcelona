import type { Metadata } from "next";
import { Flash } from "@/components/admin/flash";
import { PageTitle, Panel } from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { Input, Select, Textarea } from "@/components/admin/fields";
import { deleteReview, saveReview } from "@/lib/admin/content-actions";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Opiniones" };

type Review = {
  id: string;
  author: string;
  source: string;
  text: string;
  rating: number | null;
  status: "pending" | "approved" | "hidden";
};

const STATUS_LABEL = { pending: "pendiente", approved: "publicada", hidden: "oculta" } as const;

function ReviewFields({ review }: { review?: Review }) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_220px]">
      <div className="space-y-4">
        <Input label="Nombre" name="author" defaultValue={review?.author} required />
        <Input
          label="Procedencia"
          name="source"
          defaultValue={review?.source}
          required
          hint="Por ejemplo: Grupo escolar, Barcelona · Google · Empresa X."
        />
        <Textarea label="Opinión" name="text" rows={5} defaultValue={review?.text} required />
      </div>
      <div className="space-y-4">
        <Select
          label="Valoración (opcional)"
          name="rating"
          defaultValue={review?.rating?.toString() ?? ""}
        >
          <option value="">Sin estrellas</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} de 5
            </option>
          ))}
        </Select>
        <Select label="Estado" name="status" defaultValue={review?.status ?? "approved"}>
          <option value="approved">Publicada en la web</option>
          <option value="pending">Pendiente</option>
          <option value="hidden">Oculta</option>
        </Select>
      </div>
    </div>
  );
}

/** Opinions shown in the home page carousel. Only real, permitted opinions. */
export default async function ReviewsAdmin({ searchParams }: PageProps<"/admin/opiniones">) {
  await requireStaff();
  const { ok, error } = await searchParams;
  const db = await createClient();
  const { data } = await db
    .from("reviews")
    .select("id, author, source, text, rating, status")
    .order("created_at", { ascending: false });
  const reviews = (data ?? []) as Review[];

  return (
    <>
      <PageTitle description="Las opiniones de la página de inicio. Añade solo opiniones reales y con permiso de quien las escribió; la sección no aparece hasta que haya una publicada.">
        Opiniones
      </PageTitle>
      <Flash ok={ok} error={error} />
      <Panel title="Nueva opinión">
        <form action={saveReview.bind(null, null)} className="space-y-4">
          <ReviewFields />
          <Button type="submit">Añadir</Button>
        </form>
      </Panel>
      {reviews.map((r) => (
        <Panel key={r.id} id={`opinion-${r.id}`}>
          <details>
            <summary className="cursor-pointer font-semibold">
              {r.author}{" "}
              <span className="font-normal text-tertiary">
                · {r.source} · {STATUS_LABEL[r.status]}
              </span>
            </summary>
            <form action={saveReview.bind(null, r.id)} className="mt-4 space-y-4">
              <ReviewFields review={r} />
              <div className="flex gap-3">
                <Button type="submit">Guardar</Button>
                <Button type="submit" variant="outline" formAction={deleteReview.bind(null, r.id)}>
                  Eliminar
                </Button>
              </div>
            </form>
          </details>
        </Panel>
      ))}
    </>
  );
}
