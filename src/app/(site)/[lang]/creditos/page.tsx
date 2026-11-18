import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { createT } from "@/lib/i18n/translate";
import { alternatesFor } from "@/lib/i18n/seo";
import { isLocale } from "@/lib/i18n/config";
import { library, type LibraryPhoto } from "@/lib/photos/library";
import { destinations } from "@/lib/site";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/creditos">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = createT(lang);
  return {
    title: t("Créditos de fotos y vídeo"),
    description: t("Autores y licencias de las fotos y el vídeo que usamos en la web."),
    alternates: alternatesFor("/creditos", lang),
  };
}

/** Every photo and the hero video, with author, licence and a link to the original. */
export default async function CreditsPage({ params }: PageProps<"/[lang]/creditos">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = createT(lang);
  const areaLabel = (area: string) => t(destinations.find((d) => d.area === area)?.label ?? area);

  const groups: { title: string; photos: LibraryPhoto[] }[] = [
    ...Object.entries(library.destinations).map(([area, list]) => ({
      title: areaLabel(area),
      photos: [
        ...list,
        ...[library.slots[`strip-${area}`]].filter(Boolean),
        ...library.aboutGallery.filter((p) => p.area === area),
      ],
    })),
    {
      title: t("Inicio, Sobre nosotros y blog"),
      photos: [
        ...Object.entries(library.slots)
          .filter(([k]) => !k.startsWith("strip-"))
          .map(([, p]) => p),
        ...Object.values(library.blog),
      ],
    },
  ];
  const v = library.heroVideo;

  return (
    <>
      <PageHero
        eyebrow={t("Créditos")}
        title={t("Créditos de fotos y vídeo")}
        intro={t(
          "Las fotos de la web vienen de Wikimedia Commons y el vídeo de portada de Mixkit, todos con licencia libre. Gracias a sus autores.",
        )}
      />
      <div className="container-site space-y-14 py-10 md:py-14">
        <section aria-labelledby="video-credit">
          <h2 id="video-credit" className="text-xl font-semibold text-primary">
            {t("Vídeo de portada")}
          </h2>
          <p className="mt-3 text-tertiary">
            “{v.title}” · {v.credit.author} ·{" "}
            <a
              href={v.credit.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {v.credit.source}
            </a>{" "}
            ·{" "}
            {v.credit.licenseUrl ? (
              <a
                href={v.credit.licenseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {v.credit.license}
              </a>
            ) : (
              v.credit.license
            )}
          </p>
        </section>
        {groups.map((g) => (
          <section key={g.title} aria-label={g.title}>
            <h2 className="text-xl font-semibold text-primary">{g.title}</h2>
            <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {g.photos.map((p) => (
                <li key={p.url} className="flex gap-3">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    <Image src={p.url} alt="" fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-primary">{p.alt}</p>
                    <p className="mt-1 text-tertiary">
                      © {p.credit.author} ·{" "}
                      {p.credit.licenseUrl ? (
                        <a
                          href={p.credit.licenseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {p.credit.license}
                        </a>
                      ) : (
                        p.credit.license
                      )}{" "}
                      ·{" "}
                      <a
                        href={p.credit.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {p.credit.source}
                      </a>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
