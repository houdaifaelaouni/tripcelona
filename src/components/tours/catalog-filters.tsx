import Link from "next/link";
import { Select } from "@/components/ui/field";
import { buttonClasses } from "@/components/ui/button";
import { destinations } from "@/lib/site";
import { MONTHS_ES } from "@/lib/search";
import {
  DURATION_BUCKETS,
  PRICE_BUCKETS,
  type CatalogFilters as Filters,
} from "@/lib/tours/filters";

/**
 * Plain GET form: filters are URL state, applied on the server, shareable,
 * back-button safe and usable without JavaScript.
 */
export function CatalogFilters({ filters }: { filters: Filters }) {
  return (
    <form
      action="/ofertas-de-viajes"
      method="get"
      aria-label="Filtrar excursiones"
      className="grid gap-4 rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary ring-inset lg:sticky lg:top-24"
    >
      <Select label="Destino" name="zona" defaultValue={filters.zona ?? ""}>
        <option value="">Todos los destinos</option>
        {destinations.map((d) => (
          <option key={d.area} value={d.area}>
            {d.label}
          </option>
        ))}
      </Select>
      <Select label="Mes" name="mes" defaultValue={filters.mes ? String(filters.mes) : ""}>
        <option value="">Cualquier mes</option>
        {MONTHS_ES.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </Select>
      <Select label="Duración del día" name="duracion" defaultValue={filters.duracion ?? ""}>
        <option value="">Cualquier duración</option>
        {Object.entries(DURATION_BUCKETS).map(([value, b]) => (
          <option key={value} value={value}>
            {b.label}
          </option>
        ))}
      </Select>
      <Select label="Precio por persona" name="precio" defaultValue={filters.precio ?? ""}>
        <option value="">Cualquier precio</option>
        {Object.entries(PRICE_BUCKETS).map(([value, b]) => (
          <option key={value} value={value}>
            {b.label}
          </option>
        ))}
      </Select>
      <Select
        label="Grupo"
        name="personas"
        defaultValue={filters.personas ? String(filters.personas) : ""}
        hint="Solo salidas con plazas suficientes"
      >
        <option value="">Cualquier tamaño</option>
        {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30].map((n) => (
          <option key={n} value={n}>
            {n === 1 ? "1 persona" : `${n} personas`}
          </option>
        ))}
      </Select>
      {filters.orden === "precio" && <input type="hidden" name="orden" value="precio" />}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={buttonClasses({ variant: "primary" }, "flex-1")}>
          Aplicar filtros
        </button>
        <Link href="/ofertas-de-viajes" className={buttonClasses({ variant: "ghost" })}>
          Limpiar
        </Link>
      </div>
    </form>
  );
}
