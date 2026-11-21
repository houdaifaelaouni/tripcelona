import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DefaultLanding } from "@/components/landings/default-landing";
import { DESIGNS } from "@/components/landings/designs";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { isLocale } from "@/lib/i18n/config";
import { getLandingPreview, getPublishedLanding } from "@/lib/landings/queries";
import { getSiteSettings } from "@/lib/settings";
import { getPublishedTours } from "@/lib/tours/queries";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Ad landing pages are never indexed: they would compete with the real pages. */
export async function generateMetadata({
  params,
}: PageProps<"/[lang]/l/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const landing = await getPublishedLanding(slug);
  return { title: landing?.title ?? "Tripcelona", robots: { index: false, follow: false } };
}

export default function LandingPage({ params, searchParams }: PageProps<"/[lang]/l/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LandingBody params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function LandingBody({
  params,
  searchParams,
}: {
  params: PageProps<"/[lang]/l/[slug]">["params"];
  searchParams: PageProps<"/[lang]/l/[slug]">["searchParams"];
}) {
  const { lang: locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  let landing = await getPublishedLanding(slug);
  if (!landing) {
    // Draft preview from the admin (?vista=<id>).
    await connection();
    const preview = first((await searchParams).vista);
    landing = preview ? await getLandingPreview(slug, preview) : null;
  }
  if (!landing) notFound();
  const [tours, settings] = await Promise.all([getPublishedTours(locale), getSiteSettings()]);
  const tour = landing.tourSlug ? (tours.find((x) => x.slug === landing.tourSlug) ?? null) : null;
  const Design = DESIGNS[landing.slug] ?? DefaultLanding;
  return (
    <Design
      landing={landing}
      tour={tour}
      locale={locale}
      meetingPoint={settings.meetingPoint}
      phoneDisplay={settings.phoneDisplay}
    />
  );
}
