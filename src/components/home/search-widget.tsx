"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { Tabs } from "@/components/ui/tabs";
import { buttonClasses } from "@/components/ui/button";
import { destinations } from "@/lib/site";
import { buildCatalogUrl, buildQuoteUrl, CATALOG_PATH, MONTHS_ES, QUOTE_PATH } from "@/lib/search";

// Booking-style search bar: white panel inside a yellow ring (PRD Appendix B).
const bar =
  "grid gap-1 rounded-control border-[5px] border-yellow bg-yellow md:min-h-14 md:grid-cols-[2fr_1.2fr_1fr_auto]";
const cell = "flex min-h-14 flex-col justify-center rounded-control bg-white px-3";
const cellLabel = "text-xs font-bold text-muted";
const cellControl =
  "w-full bg-transparent text-base font-bold text-ink outline-none focus-visible:outline-none";

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
      tabListClassName="gap-1"
      tabs={[
        {
          id: "excursiones",
          label: "Excursiones",
          content: (
            <form
              action={CATALOG_PATH}
              method="get"
              onSubmit={onTrips}
              className="rounded-panel rounded-tl-none bg-white/0"
            >
              <div className={bar}>
                <label className={`${cell} focus-within:ring-2 focus-within:ring-blue`}>
                  <span className={cellLabel}>Destino</span>
                  <select name="zona" className={cellControl} defaultValue="">
                    <option value="">Todos los destinos</option>
                    {destinations.map((d) => (
                      <option key={d.area} value={d.area}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`${cell} focus-within:ring-2 focus-within:ring-blue`}>
                  <span className={cellLabel}>Mes</span>
                  <select name="mes" className={cellControl} defaultValue="">
                    <option value="">Cualquier mes</option>
                    {MONTHS_ES.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`${cell} focus-within:ring-2 focus-within:ring-blue`}>
                  <span className={cellLabel}>Personas</span>
                  <input
                    name="personas"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={60}
                    placeholder="2"
                    className={cellControl}
                  />
                </label>
                <button
                  type="submit"
                  className={buttonClasses({ size: "lg" }, "min-h-14 w-full md:w-auto")}
                >
                  Ver excursión
                </button>
              </div>
              <p className="mt-2 text-sm text-white">
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
              <div className="grid gap-1 rounded-control border-[5px] border-yellow bg-yellow md:grid-cols-[1fr_auto]">
                <label className={`${cell} focus-within:ring-2 focus-within:ring-blue`}>
                  <span className={cellLabel}>Tamaño del grupo</span>
                  <input
                    name="grupo"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={500}
                    placeholder="20"
                    className={cellControl}
                  />
                </label>
                <button
                  type="submit"
                  className={buttonClasses({ size: "lg" }, "min-h-14 w-full md:w-auto")}
                >
                  Pedir presupuesto
                </button>
              </div>
              <p className="mt-2 text-sm text-white">
                Excursiones y team building a medida para grupos grandes y empresas
              </p>
            </form>
          ),
        },
      ]}
    />
  );
}
