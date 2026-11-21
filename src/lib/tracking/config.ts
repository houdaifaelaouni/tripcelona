import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { trackingFromValue, type TrackingConfig } from "./shared";

/** Settings row holding the public pixel ids (edited in Admin > Integraciones). */
export const TRACKING_SETTING = "tracking";
/** The Integraciones form calls updateTag(TRACKING_TAG). */
export const TRACKING_TAG = "tracking";

/** Public pixel / tag ids. Cached; refreshed when the media buyer saves. */
export async function getTrackingConfig(): Promise<TrackingConfig> {
  "use cache";
  cacheTag(TRACKING_TAG);
  cacheLife("hours");
  const { data, error } = await createPublicClient()
    .from("settings")
    .select("value")
    .eq("key", TRACKING_SETTING)
    .maybeSingle();
  if (error) console.error("[tracking] config unavailable:", error.message);
  return trackingFromValue(data?.value);
}
