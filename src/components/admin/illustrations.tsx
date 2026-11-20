/**
 * Admin spot art: the empty-state names used across the panel, mapped to the
 * shared animated scenes in components/illustrations (original drawings in
 * the site palette).
 */
import type { SceneName } from "@/components/illustrations/scenes";

export const ADMIN_SCENES = {
  route: "hikers",
  calendar: "calendar",
  tickets: "tickets",
  inbox: "mail",
  notebook: "map",
  photos: "sagrada",
  welcome: "bus",
} as const satisfies Record<string, SceneName>;

export type IllustrationName = keyof typeof ADMIN_SCENES;
