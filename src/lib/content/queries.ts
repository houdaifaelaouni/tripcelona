import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { loadOverlay, str } from "@/lib/i18n/overlay";
import { mediaUrl } from "@/lib/tours/media";
import { sanitizeDoc, type RichDoc } from "./rich-text";

/** Cache tag for posts, pages and FAQs; editor publishes call updateTag(CONTENT_TAG). */
export const CONTENT_TAG = "content";

export type Cover = { url: string; alt: string } | null;

export type PostSummary = {
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
  readingMinutes: number | null;
  cover: Cover;
  tags: string[];
};

export type Post = PostSummary & {
  content: RichDoc;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

export type Page = {
  slug: string;
  title: string;
  kind: "page" | "legal";
  content: RichDoc;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

export type Review = {
  id: string;
  author: string;
  source: string;
  rating: number | null;
  text: string;
};

export type Faq = { id: string; category: string | null; question: string; answer: string };

type MediaJoin = {
  bucket: string;
  path: string;
  source_url: string | null;
  alt: string | null;
} | null;

function cover(media: MediaJoin, title: string): Cover {
  const url = mediaUrl(media);
  return url ? { url, alt: media?.alt ?? title } : null;
}

const POST_SUMMARY = `id, slug, title, excerpt, published_at, reading_minutes, tags,
  media:cover_id ( bucket, path, source_url, alt )`;

export async function getPublishedPosts(locale: Locale = defaultLocale): Promise<PostSummary[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
  const { data, error } = await createPublicClient()
    .from("posts")
    .select(POST_SUMMARY)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(`Failed to load posts: ${error.message}`);
  const rows = data ?? [];
  const overlay = await loadOverlay(
    "post",
    rows.map((p) => p.id),
    locale,
  );
  return rows.map((p) => {
    const tr = overlay.get(p.id) ?? {};
    const title = str(tr.title, p.title);
    return {
      slug: p.slug,
      title,
      excerpt: str(tr.excerpt, p.excerpt),
      publishedAt: p.published_at,
      readingMinutes: p.reading_minutes,
      tags: p.tags,
      cover: cover(p.media as MediaJoin, title),
    };
  });
}

export async function getPostBySlug(
  slug: string,
  locale: Locale = defaultLocale,
): Promise<Post | null> {
  "use cache";
  cacheTag(CONTENT_TAG, `post:${slug}`);
  cacheLife("hours");
  const { data, error } = await createPublicClient()
    .from("posts")
    .select(`${POST_SUMMARY}, content, seo_title, seo_description, updated_at`)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Failed to load post ${slug}: ${error.message}`);
  if (!data) return null;
  const tr = (await loadOverlay("post", [data.id], locale)).get(data.id) ?? {};
  const title = str(tr.title, data.title);
  return {
    slug: data.slug,
    title,
    excerpt: str(tr.excerpt, data.excerpt),
    publishedAt: data.published_at,
    readingMinutes: data.reading_minutes,
    tags: data.tags,
    cover: cover(data.media as MediaJoin, title),
    content: sanitizeDoc(tr.content ?? data.content),
    seoTitle: str(tr.seo_title, data.seo_title),
    seoDescription: str(tr.seo_description, data.seo_description),
    updatedAt: data.updated_at,
  };
}

export async function getPageBySlug(
  slug: string,
  locale: Locale = defaultLocale,
): Promise<Page | null> {
  "use cache";
  cacheTag(CONTENT_TAG, `page:${slug}`);
  cacheLife("hours");
  const { data, error } = await createPublicClient()
    .from("pages")
    .select("id, slug, title, kind, content, seo_title, seo_description, updated_at")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Failed to load page ${slug}: ${error.message}`);
  if (!data) return null;
  const tr = (await loadOverlay("page", [data.id], locale)).get(data.id) ?? {};
  return {
    slug: data.slug,
    title: str(tr.title, data.title),
    kind: data.kind as Page["kind"],
    content: sanitizeDoc(tr.content ?? data.content),
    seoTitle: str(tr.seo_title, data.seo_title),
    seoDescription: str(tr.seo_description, data.seo_description),
    updatedAt: data.updated_at,
  };
}

export async function getContentSlugs(): Promise<{ posts: string[]; pages: string[] }> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
  const db = createPublicClient();
  const [posts, pages] = await Promise.all([
    db.from("posts").select("slug, updated_at").eq("status", "published"),
    db.from("pages").select("slug, updated_at").eq("status", "published"),
  ]);
  return {
    posts: (posts.data ?? []).map((r) => r.slug),
    pages: (pages.data ?? []).map((r) => r.slug),
  };
}

export async function getPublishedFaqs(locale: Locale = defaultLocale): Promise<Faq[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
  const { data, error } = await createPublicClient()
    .from("faqs")
    .select("id, category, question, answer")
    .eq("status", "published")
    .order("category", { nullsFirst: true })
    .order("sort_order");
  if (error) throw new Error(`Failed to load FAQs: ${error.message}`);
  const rows = data ?? [];
  const overlay = await loadOverlay(
    "faq",
    rows.map((f) => f.id),
    locale,
  );
  return rows.map((f) => {
    const tr = overlay.get(f.id) ?? {};
    return {
      id: f.id,
      category: str(tr.category, f.category),
      question: str(tr.question, f.question),
      answer: str(tr.answer, f.answer),
    };
  });
}

/** Opinions the owner approved in the admin (decision D6). Empty until some exist. */
export async function getApprovedReviews(): Promise<Review[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
  const { data, error } = await createPublicClient()
    .from("reviews")
    .select("id, author, source, rating, text")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) throw new Error(`Failed to load reviews: ${error.message}`);
  return data ?? [];
}
