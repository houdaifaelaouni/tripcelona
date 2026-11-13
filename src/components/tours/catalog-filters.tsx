import Link from "@/components/i18n/link";
import { Select } from "@/components/ui/field";
import { buttonClasses } from "@/components/ui/button";
import { createT } from "@/lib/i18n/translate";
import { localizePath, type Locale } from "@/lib/i18n/config";
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
export function CatalogFilters({ filters, locale }: { filters: Filters; locale: Locale }) {
  const t = createT(locale);
  return (
    <form
      action={localizePath("/ofertas-de-viajes", locale)}
      method="get"
      aria-label={t("Filtrar excursiones")}
      className="grid gap-4 rounded-2xl bg-primary p-5 shadow-xs ring-1 ring-secondary ring-inset lg:sticky lg:top-24"
    >
      <Select label={t("Destino")} name="zona" defaultValue={filters.zona ?? ""}>
        <option value="">{t("Todos los destinos")}</option>
        {destinations.map((d) => (
          <option key={d.area} value={d.area}>
            {t(d.label)}
          </option>
        ))}
      </Select>
      <Select label={t("Mes")} name="mes" defaultValue={filters.mes ? String(filters.mes) : ""}>
        <option value="">{t("Cualquier mes")}</option>
        {MONTHS_ES.map((m, i) => (
          <option key={m} value={i + 1}>
            {t(m)}
          </option>
        ))}
      </Select>
      <Select label={t("Duración del día")} name="duracion" defaultValue={filters.duracion ?? ""}>
        <option value="">{t("Cualquier duración")}</option>
        {Object.entries(DURATION_BUCKETS).map(([value, b]) => (
          <option key={value} value={value}>
            {t(b.label)}
          </option>
        ))}
      </Select>
      <Select label={t("Precio por persona")} name="precio" defaultValue={filters.precio ?? ""}>
        <option value="">{t("Cualquier precio")}</option>
        {Object.entries(PRICE_BUCKETS).map(([value, b]) => (
          <option key={value} value={value}>
            {t(b.label)}
          </option>
        ))}
      </Select>
      <Select
        label={t("Grupo")}
        name="personas"
        defaultValue={filters.personas ? String(filters.personas) : ""}
        hint={t("Solo salidas con plazas suficientes")}
      >
        <option value="">{t("Cualquier tamaño")}</option>
        {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30].map((n) => (
          <option key={n} value={n}>
            {n === 1 ? t("1 persona") : t("{n} personas", { n })}
          </option>
        ))}
      </Select>
      {filters.orden === "precio" && <input type="hidden" name="orden" value="precio" />}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={buttonClasses({ variant: "primary" }, "flex-1")}>
          {t("Aplicar filtros")}
        </button>
        <Link href="/ofertas-de-viajes" className={buttonClasses({ variant: "ghost" })}>
          {t("Limpiar")}
        </Link>
      </div>
    </form>
  );
}
