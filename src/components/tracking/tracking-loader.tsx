import { getTrackingConfig } from "@/lib/tracking/config";
import { Tracking } from "./tracking";

/** Server half: reads the cached public pixel ids and hands them to the client. */
export async function TrackingLoader() {
  const config = await getTrackingConfig();
  return <Tracking config={config} />;
}
