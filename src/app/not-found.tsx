import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ButtonLink } from "@/components/ui/button";
import { destinations } from "@/lib/site";
import { buildCatalogUrl } from "@/lib/search";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <section className="container-site py-16">
          <p className="text-sm font-bold text-blue">Error 404</p>
          <h1 className="mt-2 text-3xl">No encontramos esta página</h1>
          <p className="mt-3 max-w-xl text-muted">
            Puede que el enlace haya cambiado. Busca tu próxima excursión o vuelve al inicio.
          </p>

          <form
            action="/ofertas-de-viajes"
            method="get"
            className="mt-6 flex max-w-md gap-2"
            role="search"
          >
            <label htmlFor="nf-zona" className="sr-only">
              Destino
            </label>
            <select
              id="nf-zona"
              name="zona"
              className="h-10 min-w-0 flex-1 rounded-control border border-border-strong bg-white px-3"
              defaultValue=""
            >
              <option value="">Todos los destinos</option>
              {destinations.map((d) => (
                <option key={d.area} value={d.area}>
                  {d.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="h-10 rounded-control bg-blue px-4 font-bold text-white hover:bg-blue-dark"
            >
              Buscar
            </button>
          </form>

          <h2 className="mt-10 text-lg">Excursiones destacadas</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {destinations.map((d) => (
              <li key={d.area}>
                <Link
                  href={buildCatalogUrl({ area: d.area })}
                  className="text-blue hover:underline"
                >
                  {d.label}
                </Link>
              </li>
            ))}
          </ul>

          <ButtonLink href="/" variant="secondary" className="mt-10">
            Volver al inicio
          </ButtonLink>
        </section>
      </main>
      <Footer />
    </>
  );
}
