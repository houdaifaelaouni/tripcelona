"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/field";

type Faq = { id: string; category: string | null; question: string; answer: string };

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** FR-71: FAQ accordion grouped by category, with instant search. Works without JS (all open to search via the browser). */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const term = fold(q.trim());
    if (!term) return faqs;
    return faqs.filter((f) => fold(`${f.question} ${f.answer}`).includes(term));
  }, [faqs, q]);
  const groups = useMemo(() => {
    const map = new Map<string, Faq[]>();
    for (const f of shown) {
      const key = f.category ?? "";
      map.set(key, [...(map.get(key) ?? []), f]);
    }
    return [...map.entries()];
  }, [shown]);

  return (
    <div>
      <div className="max-w-md">
        <Input
          label="Buscar en las preguntas"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ej.: cancelación, mascotas, punto de encuentro"
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {q ? `${shown.length} preguntas encontradas` : ""}
      </p>
      {shown.length === 0 && (
        <p className="mt-6 text-muted">
          No hay preguntas con «{q}». Prueba con otra palabra o escríbenos.
        </p>
      )}
      {groups.map(([category, items]) => (
        <section key={category || "general"} className="mt-6">
          {category && <h2 className="mb-3 text-xl">{category}</h2>}
          <div className="divide-y divide-border rounded-card border border-border">
            {items.map((f) => (
              <details key={f.id} className="group" open={Boolean(q)}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-bold marker:hidden hover:bg-surface-alt [&::-webkit-details-marker]:hidden">
                  {f.question}
                  <span
                    aria-hidden
                    className="text-blue transition-transform group-open:rotate-180"
                  >
                    ▾
                  </span>
                </summary>
                <div className="space-y-2 px-4 pb-4 text-muted">
                  {f.answer.split(/\n{2,}/).map((para, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {para}
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
