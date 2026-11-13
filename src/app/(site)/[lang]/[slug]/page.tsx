import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import { RichText } from "@/components/content/rich-text";
import { JsonLd } from "@/components/seo/json-ld";
import { getContentSlugs, getPageBySlug } from "@/lib/content/queries";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { getSiteSettings, legalTokens } from "@/lib/settings";
import { createT } from "@/lib/i18n/translate";
import { alternatesFor } from "@/lib/i18n/seo";
import { isLocale, localizePath } from "@/lib/i18n/config";
import { INTL } from "@/lib/tours/format";

/** Placeholder param so the build has one entry when no page is published yet. */
const NONE = "_";

export async function generateStaticParams() {
  const { pages } = await getContentSlugs();
  return (pages.length ? pages : [NONE]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/[slug]">): Promise<Metadata> {
  const { slug, lang } = await params;
  if (!isLocale(lang)) notFound();
  const page = await getPageBySlug(slug, lang);
  if (!page) notFound();
  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? undefined,
    alternates: alternatesFor(`/${page.slug}`, lang),
    // Legal pages stay indexable (they were noindex on WordPress only by accident of the theme).
  };
}

/**
 * `params` is read inside Suspense: when a cache tag used by the layout is
 * invalidated, Next re-prerenders the route shell with fallback params, and
 * awaiting them outside a boundary fails that render (500 on every slug).
 */
export default function ContentPage({ params }: PageProps<"/[lang]/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ContentPageBody params={params} />
    </Suspense>
  );
}

async function ContentPageBody({ params }: { params: PageProps<"/[lang]/[slug]">["params"] }) {
  const { slug, lang: locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = createT(locale);
  const updatedFmt = new Intl.DateTimeFormat(INTL[locale], {
    dateStyle: "long",
    timeZone: "Europe/Madrid",
  });
  const page = await getPageBySlug(slug, locale);
  if (!page) notFound();
  const settings = await getSiteSettings();

  return (
    <article>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t("Inicio"), path: localizePath("/", locale) },
          { name: page.title, path: localizePath(`/${page.slug}`, locale) },
        ])}
      />
      <PageHero
        compact
        eyebrow={page.kind === "legal" ? t("Información legal") : "Tripcelona"}
        title={page.title}
      />
      <div className="container-site py-10 md:py-14">
        <RichText
          className="mt-6"
          doc={page.content}
          tokens={page.kind === "legal" ? legalTokens(settings) : {}}
        />
        {page.kind === "legal" && (
          <p className="mt-10 text-sm text-tertiary">
            {t("Versión publicada en esta web el {date}.", {
              date: updatedFmt.format(new Date(page.updatedAt)),
            })}
          </p>
        )}
      </div>
    </article>
  );
}
