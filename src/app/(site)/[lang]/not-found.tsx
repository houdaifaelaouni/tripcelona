"use client";

import Link from "@/components/i18n/link";
import { useLocale, useT } from "@/components/i18n/provider";
import { localizePath } from "@/lib/i18n/config";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { destinations } from "@/lib/site";
import { buildCatalogUrl } from "@/lib/search";

export default function NotFound() {
  const t = useT();
  const locale = useLocale();
  return (
    <>
      <section className="container-site py-16 md:py-24">
        <p className="text-sm font-semibold text-tertiary">{t("Error 404")}</p>
        <h1 className="mt-2 text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
          {t("No encontramos esta página")}
        </h1>
        <p className="mt-3 max-w-xl text-tertiary">
          {t("Puede que el enlace haya cambiado. Busca tu próxima excursión o vuelve al inicio.")}
        </p>

        <form
          action={localizePath("/ofertas-de-viajes", locale)}
          method="get"
          className="mt-8 flex max-w-md items-center gap-1 rounded-full border border-secondary bg-white p-1.5 shadow-lg"
          role="search"
        >
          <label htmlFor="nf-zona" className="sr-only">
            {t("Destino")}
          </label>
          <select
            id="nf-zona"
            name="zona"
            className="h-11 min-w-0 flex-1 rounded-full bg-transparent px-4"
            defaultValue=""
          >
            <option value="">{t("Todos los destinos")}</option>
            {destinations.map((d) => (
              <option key={d.area} value={d.area}>
                {t(d.label)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className={buttonClasses({ size: "sm", shape: "pill" }, "h-11 px-5")}
          >
            {t("Buscar")}
          </button>
        </form>

        <h2 className="mt-12 text-display-sm">{t("Excursiones destacadas")}</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {destinations.map((d) => (
            <li key={d.area}>
              <Link
                href={buildCatalogUrl({ area: d.area })}
                className="inline-flex h-10 items-center rounded-full border border-primary px-4 text-sm font-semibold hover:border-brand"
              >
                {t(d.label)}
              </Link>
            </li>
          ))}
        </ul>

        <ButtonLink href="/" variant="secondary" className="mt-10">
          {t("Volver al inicio")}
        </ButtonLink>
      </section>
    </>
  );
}
