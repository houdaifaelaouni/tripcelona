import type { Metadata } from "next";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import Link from "@/components/i18n/link";
import { Badge } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import { RichText } from "@/components/content/rich-text";
import { JsonLd } from "@/components/seo/json-ld";
import { getContentSlugs, getPostBySlug } from "@/lib/content/queries";
import { blogPostingJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { createT } from "@/lib/i18n/translate";
import { alternatesFor } from "@/lib/i18n/seo";
import { isLocale, localizePath } from "@/lib/i18n/config";
import { INTL } from "@/lib/tours/format";

const NONE = "_";
export async function generateStaticParams() {
  const { posts } = await getContentSlugs();
  return (posts.length ? posts : [NONE]).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/blog/[slug]">): Promise<Metadata> {
  const { slug, lang } = await params;
  if (!isLocale(lang)) notFound();
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    alternates: alternatesFor(`/blog/${post.slug}`, lang),
    openGraph: {
      type: "article",
      title: post.seoTitle ?? post.title,
      url: localizePath(`/blog/${post.slug}`, lang),
      publishedTime: post.publishedAt ?? undefined,
      images: post.cover ? [{ url: post.cover.url, alt: post.cover.alt }] : undefined,
    },
  };
}

/**
 * `params` is read inside Suspense: when a cache tag used by the layout is
 * invalidated, Next re-prerenders the route shell with fallback params, and
 * awaiting them outside a boundary fails that render (500 on every slug).
 */
export default function PostPage({ params }: PageProps<"/[lang]/blog/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PostPageBody params={params} />
    </Suspense>
  );
}

async function PostPageBody({ params }: { params: PageProps<"/[lang]/blog/[slug]">["params"] }) {
  const { slug, lang: locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = createT(locale);
  const dateFmt = new Intl.DateTimeFormat(INTL[locale], {
    dateStyle: "long",
    timeZone: "Europe/Madrid",
  });
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="container-site py-8 md:py-16">
      <div className="mx-auto max-w-3xl">
        <JsonLd
          data={[
            blogPostingJsonLd(post),
            breadcrumbJsonLd([
              { name: t("Inicio"), path: localizePath("/", locale) },
              { name: t("Blog"), path: localizePath("/blog", locale) },
              { name: post.title, path: localizePath(`/blog/${post.slug}`, locale) },
            ]),
          ]}
        />
        <nav aria-label={t("Migas de pan")} className="text-sm text-tertiary">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
          >
            <ChevronLeft aria-hidden size={16} />
            {t("Blog")}
          </Link>
        </nav>
        <h1 className="mt-3 text-3xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2.5rem]">
          {post.title}
        </h1>
        <p className="mt-2 text-sm text-tertiary">
          {post.publishedAt && (
            <time dateTime={post.publishedAt}>{dateFmt.format(new Date(post.publishedAt))}</time>
          )}
          {post.readingMinutes ? ` · ${t("{n} min de lectura", { n: post.readingMinutes })}` : ""}
        </p>
        {post.cover && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl bg-secondary">
            <Image
              src={post.cover.url}
              alt={post.cover.alt}
              fill
              priority
              sizes="(min-width: 800px) 768px, 100vw"
              className="object-cover"
            />
          </div>
        )}
        <RichText className="mt-8" doc={post.content} />
        {post.tags.length > 0 && (
          <div className="mt-10 border-t border-secondary pt-6">
            <h2 className="sr-only">{t("Etiquetas")}</h2>
            <ul className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <Badge>{tag}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
