import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { sanitizeDoc } from "@/lib/content/rich-text";
import { mediaUrl } from "./media";
import type { Departure, TourDetail, TourImage, TourSummary } from "./types";

/** Cache tag every tour read carries; admin publishes call revalidateTag(TOURS_TAG). */
export const TOURS_TAG = "tours";

const SUMMARY_SELECT = `
  slug, title, summary, area, area_slug, difficulty, duration_minutes, price_from_cents,
  tour_departures ( id, starts_at, ends_at, capacity, seats_taken, price_cents, status ),
  tour_images ( storage_path, alt, sort_order, media ( bucket, path, source_url ) )
`;

type DepartureRow = {
  id: string;
  starts_at: string;
  ends_at: string | null;
  capacity: number;
  seats_taken: number;
  price_cents: number;
  status: Departure["status"];
};
type ImageRow = {
  storage_path: string;
  alt: string | null;
  sort_order: number;
  media: { bucket: string; path: string; source_url: string | null } | null;
};

function toDepartures(rows: DepartureRow[], now: number): Departure[] {
  return rows
    .filter((d) => Date.parse(d.starts_at) > now && d.status !== "cancelled")
    .map((d) => ({
      id: d.id,
      startsAt: d.starts_at,
      endsAt: d.ends_at,
      seatsLeft: Math.max(d.capacity - d.seats_taken, 0),
      priceCents: d.price_cents,
      status: d.status,
    }))
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

function toImages(rows: ImageRow[], title: string): TourImage[] {
  return [...rows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .flatMap((img, i) => {
      const url = mediaUrl(img.media);
      // TODO(US-27): real alt text per image; this fallback is descriptive only.
      return url ? [{ url, alt: img.alt ?? `${title}, foto ${i + 1}` }] : [];
    });
}

function toSummary(
  row: {
    slug: string;
    title: string;
    summary: string | null;
    area: string | null;
    area_slug: string | null;
    difficulty: string | null;
    duration_minutes: number | null;
    price_from_cents: number | null;
    tour_departures: DepartureRow[];
    tour_images: ImageRow[];
  },
  now: number,
): TourSummary {
  const images = toImages(row.tour_images, row.title);
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    area: row.area,
    areaSlug: row.area_slug,
    difficulty: row.difficulty,
    durationMinutes: row.duration_minutes,
    priceFromCents: row.price_from_cents,
    image: images[0] ?? null,
    gallery: images,
    departures: toDepartures(row.tour_departures, now),
  };
}

function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/** All published tours with upcoming departures. Cached; refreshed hourly or on publish. */
export async function getPublishedTours(): Promise<TourSummary[]> {
  "use cache";
  cacheTag(TOURS_TAG);
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("tours")
    .select(SUMMARY_SELECT)
    .eq("status", "published")
    .order("title");
  if (error) throw new Error(`Failed to load tours: ${error.message}`);
  const now = Date.now();
  return (data ?? []).map((row) => toSummary(row as Parameters<typeof toSummary>[0], now));
}

export async function getTourSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(TOURS_TAG);
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("tours")
    .select("slug")
    .eq("status", "published");
  if (error) throw new Error(`Failed to load tour slugs: ${error.message}`);
  return (data ?? []).map((r) => r.slug);
}

export async function getTourBySlug(slug: string): Promise<TourDetail | null> {
  "use cache";
  cacheTag(TOURS_TAG, `tour:${slug}`);
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("tours")
    .select(
      `${SUMMARY_SELECT},
       summary, description, highlights, inclusions, exclusions, packing_list, meeting_point, map_url,
       seo_title, seo_description,
       tour_itinerary ( sort_order, time_label, title, body ),
       tour_faqs ( sort_order, question, answer )`,
    )
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Failed to load tour ${slug}: ${error.message}`);
  if (!data) return null;

  const summary = toSummary(data as Parameters<typeof toSummary>[0], Date.now());
  return {
    ...summary,
    summary: data.summary,
    description: data.description ? sanitizeDoc(data.description) : null,
    highlights: strings(data.highlights),
    inclusions: strings(data.inclusions),
    exclusions: strings(data.exclusions),
    packingList: strings(data.packing_list),
    meetingPoint: data.meeting_point,
    mapUrl: data.map_url,
    seoTitle: data.seo_title,
    seoDescription: data.seo_description,
    images: toImages(data.tour_images as ImageRow[], data.title),
    itinerary: [...data.tour_itinerary]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({ title: s.title, timeLabel: s.time_label, body: s.body })),
    faqs: [...data.tour_faqs]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((f) => ({ question: f.question, answer: f.answer })),
  };
}

/** Same area first, then soonest departure (FR-27). */
export function relatedTours(all: TourSummary[], current: TourSummary, limit = 3): TourSummary[] {
  const next = (t: TourSummary) =>
    t.departures[0] ? Date.parse(t.departures[0].startsAt) : Number.POSITIVE_INFINITY;
  return all
    .filter((t) => t.slug !== current.slug)
    .sort(
      (a, b) =>
        Number(b.areaSlug === current.areaSlug) - Number(a.areaSlug === current.areaSlug) ||
        next(a) - next(b),
    )
    .slice(0, limit);
}
