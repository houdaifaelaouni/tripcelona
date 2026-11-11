"use client";

/*
 * Pill search bar (design rule: one rounded bar split into labelled segments
 * by hairlines, ending in a round search button). On phones the segments
 * stack inside a rounded panel. Plain GET forms, so search works without JS.
 */
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { destinations } from "@/lib/site";
import { buildCatalogUrl, buildQuoteUrl, CATALOG_PATH, MONTHS_ES, QUOTE_PATH } from "@/lib/search";

const bar = cn(
  "flex flex-col gap-1 rounded-2xl bg-primary p-2 text-primary shadow-xl ring-1 ring-secondary",
  "md:flex-row md:items-center md:gap-0 md:rounded-full md:p-2 md:pl-2",
);

function Segment({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "relative flex min-h-14 flex-1 cursor-pointer flex-col justify-center rounded-control px-4 hover:bg-surface-alt md:rounded-full md:px-6",
        // Hairline between segments on the pill (hidden next to the hovered one).
        "md:not-first:before:absolute md:not-first:before:inset-y-3 md:not-first:before:left-0 md:not-first:before:w-px md:not-first:before:bg-border",
        "focus-within:bg-surface-alt",
        className,
      )}
    >
      <span className="text-caption font-semibold">{label}</span>
      {children}
    </label>
  );
}

const control =
  "w-full cursor-pointer appearance-none bg-transparent text-meta text-muted outline-none focus-visible:outline-none";

function SearchOrb({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className={cn(
        "flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-solid px-5 font-semibold text-white shadow-xs-skeuomorphic transition-colors hover:bg-brand-solid_hover",
        "md:ml-2 md:size-12 md:rounded-full md:px-0",
      )}
    >
      <Search size={18} strokeWidth={2.5} aria-hidden />
      <span className="md:sr-only">{label}</span>
    </button>
  );
}

export function SearchWidget() {
  const router = useRouter();

  // Plain GET forms work without JavaScript; with JS we drop empty params.
  function onTrips(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    router.push(
      buildCatalogUrl({
        area: String(data.get("zona") ?? ""),
        month: String(data.get("mes") ?? ""),
        travellers: String(data.get("personas") ?? ""),
      }),
    );
  }

  function onGroups(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    router.push(buildQuoteUrl(String(data.get("grupo") ?? "")));
  }

  return (
    <Tabs
      label="Tipo de búsqueda"
      tabListClassName="mb-4"
      tabs={[
        {
          id: "excursiones",
          label: "Excursiones",
          content: (
            <form action={CATALOG_PATH} method="get" onSubmit={onTrips}>
              <div className={bar}>
                <Segment label="Zona" className="md:flex-[1.4]">
                  <select name="zona" className={control} defaultValue="">
                    <option value="">Todos los destinos</option>
                    {destinations.map((d) => (
                      <option key={d.area} value={d.area}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </Segment>
                <Segment label="Fecha">
                  <select name="mes" className={control} defaultValue="">
                    <option value="">Cualquier mes</option>
                    {MONTHS_ES.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Segment>
                <Segment label="Personas">
                  <input
                    name="personas"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={60}
                    placeholder="¿Cuántos sois?"
                    className={cn(control, "cursor-text placeholder:text-muted")}
                  />
                </Segment>
                <SearchOrb label="Ver excursiones" />
              </div>
              <p className="mt-3 text-meta text-white">
                Salida en domingo desde Estació del Nord, Barcelona
              </p>
            </form>
          ),
        },
        {
          id: "grupos",
          label: "Grupos y empresas",
          content: (
            <form action={QUOTE_PATH} method="get" onSubmit={onGroups}>
              <div className={cn(bar, "md:max-w-xl")}>
                <Segment label="Tamaño del grupo">
                  <input
                    name="grupo"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={500}
                    placeholder="Ej. 20 personas"
                    className={cn(control, "cursor-text placeholder:text-muted")}
                  />
                </Segment>
                <SearchOrb label="Pedir presupuesto" />
              </div>
              <p className="mt-3 text-meta text-white">
                Excursiones y team building a medida para grupos grandes y empresas
              </p>
            </form>
          ),
        },
      ]}
    />
  );
}
