import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
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

const POST_SUMMARY = `slug, title, excerpt, published_at, reading_minutes, tags,
  media:cover_id ( bucket, path, source_url, alt )`;

export async function getPublishedPosts(): Promise<PostSummary[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
  const { data, error } = await createPublicClient()
    .from("posts")
    .select(POST_SUMMARY)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(`Failed to load posts: ${error.message}`);
  return (data ?? []).map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    publishedAt: p.published_at,
    readingMinutes: p.reading_minutes,
    tags: p.tags,
    cover: cover(p.media as MediaJoin, p.title),
  }));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
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
  return {
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt,
    publishedAt: data.published_at,
    readingMinutes: data.reading_minutes,
    tags: data.tags,
    cover: cover(data.media as MediaJoin, data.title),
    content: sanitizeDoc(data.content),
    seoTitle: data.seo_title,
    seoDescription: data.seo_description,
    updatedAt: data.updated_at,
  };
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  "use cache";
  cacheTag(CONTENT_TAG, `page:${slug}`);
  cacheLife("hours");
  const { data, error } = await createPublicClient()
    .from("pages")
    .select("slug, title, kind, content, seo_title, seo_description, updated_at")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Failed to load page ${slug}: ${error.message}`);
  if (!data) return null;
  return {
    slug: data.slug,
    title: data.title,
    kind: data.kind as Page["kind"],
    content: sanitizeDoc(data.content),
    seoTitle: data.seo_title,
    seoDescription: data.seo_description,
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

export async function getPublishedFaqs(): Promise<Faq[]> {
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
  return data ?? [];
}
