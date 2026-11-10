import type { Metadata } from "next";
import { Flash } from "@/components/admin/flash";
import { PageTitle, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { deleteFaq, saveFaq } from "@/lib/admin/content-actions";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Preguntas frecuentes" };

type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  status: "draft" | "published" | "archived";
};

function FaqFields({ faq, nextOrder }: { faq?: Faq; nextOrder: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_200px]">
      <div className="space-y-4">
        <Input label="Pregunta" name="question" defaultValue={faq?.question} required />
        <Textarea
          label="Respuesta"
          name="answer"
          rows={4}
          defaultValue={faq?.answer}
          required
          hint="Deja una línea en blanco entre párrafos."
        />
      </div>
      <div className="space-y-4">
        <Input label="Categoría (opcional)" name="category" defaultValue={faq?.category ?? ""} />
        <Input
          label="Orden"
          name="sort_order"
          type="number"
          min={0}
          defaultValue={faq?.sort_order ?? nextOrder}
        />
        <Select label="Estado" name="status" defaultValue={faq?.status ?? "published"}>
          <option value="published">Publicada</option>
          <option value="draft">Borrador</option>
          <option value="archived">Archivada</option>
        </Select>
      </div>
    </div>
  );
}

/** FR-71: FAQ content, editable without a deploy. */
export default async function FaqAdmin({ searchParams }: PageProps<"/admin/faqs">) {
  await requireStaff();
  const { ok, error } = await searchParams;
  const db = await createClient();
  const { data } = await db
    .from("faqs")
    .select("id, question, answer, category, sort_order, status")
    .order("category", { nullsFirst: true })
    .order("sort_order");
  const faqs = (data ?? []) as Faq[];
  const nextOrder = (faqs.at(-1)?.sort_order ?? 0) + 10;

  return (
    <>
      <PageTitle>Preguntas frecuentes</PageTitle>
      <Flash ok={ok} error={error} />
      <Panel title="Nueva pregunta">
        <form action={saveFaq.bind(null, null)} className="space-y-4">
          <FaqFields nextOrder={nextOrder} />
          <Button type="submit">Añadir</Button>
        </form>
      </Panel>
      {faqs.map((f) => (
        <Panel key={f.id} id={`faq-${f.id}`}>
          <details>
            <summary className="cursor-pointer font-bold">
              {f.question}{" "}
              <span className="font-normal text-muted">
                ·{" "}
                {f.status === "published"
                  ? "publicada"
                  : f.status === "draft"
                    ? "borrador"
                    : "archivada"}
                {f.answer.match(/@gmail\.com/) ? " · ⚠ menciona un email personal" : ""}
              </span>
            </summary>
            <form action={saveFaq.bind(null, f.id)} className="mt-4 space-y-4">
              <FaqFields faq={f} nextOrder={nextOrder} />
              <div className="flex gap-3">
                <Button type="submit">Guardar</Button>
                <Button type="submit" variant="outline" formAction={deleteFaq.bind(null, f.id)}>
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
