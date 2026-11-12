import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

/** Cache tag for approved reviews; nothing publishes them yet, so hourly refresh. */
export const REVIEWS_TAG = "reviews";

export type Review = {
  id: string;
  author: string;
  source: string;
  rating: number | null;
  text: string;
};

/**
 * Approved reviews for the home page. RLS already hides anything that is not
 * approved; the status filter keeps the same rule if the client ever changes.
 */
export async function getApprovedReviews(limit = 6): Promise<Review[]> {
  "use cache";
  cacheTag(REVIEWS_TAG);
  cacheLife("hours");

  const { data, error } = await createPublicClient()
    .from("reviews")
    .select("id, author, source, rating, text")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    // A missing review block should never take the home page down.
    console.error("[reviews] could not load reviews:", error.message);
    return [];
  }
  return data ?? [];
}
