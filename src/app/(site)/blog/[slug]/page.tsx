import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Suspense } from "react";
import { RichText } from "@/components/content/rich-text";
import { JsonLd } from "@/components/seo/json-ld";
import { getContentSlugs, getPostBySlug } from "@/lib/content/queries";
import { blogPostingJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";

const NONE = "_";
const dateFmt = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" });

export async function generateStaticParams() {
  const { posts } = await getContentSlugs();
  return (posts.length ? posts : [NONE]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.seoTitle ?? post.title,
      url: `/blog/${post.slug}`,
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
export default function PostPage({ params }: PageProps<"/blog/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PostPageBody params={params} />
    </Suspense>
  );
}

async function PostPageBody({ params }: { params: PageProps<"/blog/[slug]">["params"] }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="container-site py-8 md:py-12">
      <JsonLd
        data={[
          blogPostingJsonLd(post),
          breadcrumbJsonLd([
            { name: "Inicio", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <nav aria-label="Migas de pan" className="text-sm text-muted">
        <Link href="/blog" className="underline">
          Blog
        </Link>
      </nav>
      <h1 className="mt-2 max-w-3xl text-3xl">{post.title}</h1>
      <p className="mt-2 text-sm text-muted">
        {post.publishedAt && (
          <time dateTime={post.publishedAt}>{dateFmt.format(new Date(post.publishedAt))}</time>
        )}
        {post.readingMinutes ? ` · ${post.readingMinutes} min de lectura` : ""}
      </p>
      {post.cover && (
        <div className="relative mt-6 aspect-[16/9] max-w-4xl overflow-hidden rounded-panel bg-surface-alt">
          <Image
            src={post.cover.url}
            alt={post.cover.alt}
            fill
            priority
            sizes="(min-width: 1140px) 900px, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <RichText className="mt-8" doc={post.content} />
      {post.tags.length > 0 && (
        <p className="mt-8 text-sm text-muted">Etiquetas: {post.tags.join(", ")}</p>
      )}
    </article>
  );
}
