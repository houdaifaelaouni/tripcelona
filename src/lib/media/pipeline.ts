/**
 * Pure helpers for the media pipeline (US-30). The script lives in
 * scripts/media-pipeline.ts; these are kept separate so they can be tested.
 */
export const MAX_EDGE = 2000;

/** Stable Storage paths: same base as the legacy file, new extensions. */
export function targetPaths(path: string): { base: string; webp: string; avif: string } {
  const base = path.replace(/\.(jpe?g|png|webp|avif|gif)$/i, "");
  return { base, webp: `${base}.webp`, avif: `${base}.avif` };
}

/**
 * Placeholder alt text from a file name ("Carruaje-de-caballos-fageda.jpg" ->
 * "Carruaje de caballos fageda"). Better than nothing for screen readers until
 * the owner writes real descriptions; files with no usable words get null.
 */
export function placeholderAlt(path: string): string | null {
  const name = (path.split("/").pop() ?? "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/-(scaled|\d+x\d+|\d+)(?=-|$)/gi, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = name.split(" ").filter((w) => /[a-záéíóúñ]{3,}/i.test(w));
  if (words.length === 0) return null;
  const text = words.join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export type MediaReport = {
  processed: string[];
  skipped: string[];
  failed: { path: string; error: string }[];
};
