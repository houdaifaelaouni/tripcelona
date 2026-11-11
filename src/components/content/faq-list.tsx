"use client";

import { ChevronDown, Search } from "lucide-react";
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

  if (faqs.length === 0) {
    return <p className="text-tertiary">Pronto publicaremos las preguntas frecuentes.</p>;
  }

  return (
    <div>
      <div className="relative max-w-md">
        <Search
          aria-hidden
          size={18}
          className="pointer-events-none absolute bottom-[19px] left-4 text-tertiary"
        />
        <Input
          className="rounded-full pl-11"
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
        <p className="mt-6 text-tertiary">
          No hay preguntas con «{q}». Prueba con otra palabra o escríbenos.
        </p>
      )}
      {groups.map(([category, items]) => (
        <section key={category || "general"} className="mt-10">
          {category && <h2 className="mb-2 text-display-sm">{category}</h2>}
          <div className="divide-y divide-secondary border-y border-secondary">
            {items.map((f) => (
              <details key={f.id} className="group" open={Boolean(q)}>
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                  {f.question}
                  <ChevronDown
                    aria-hidden
                    size={20}
                    className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  />
                </summary>
                <div className="space-y-2 pb-5 text-tertiary">
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
