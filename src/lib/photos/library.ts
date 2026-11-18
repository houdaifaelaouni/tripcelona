/**
 * Curated, free-licensed photo library for the public site.
 *
 * Every photo is self-hosted under /public/photos and used in exactly one
 * place on the site (see `slots` in library.json), so no image repeats.
 * Each one carries its author, source page and licence; the site shows that
 * credit on (or under) the photo and lists everything on /creditos.
 *
 * library.json lists every file in /public/photos and /public/video with its
 * author and licence (Wikimedia Commons photos, Mixkit video). Change a photo
 * by replacing its file and its entry here.
 */
import data from "./library.json";

export type PhotoCredit = {
  author: string;
  /** Page where the photo is published (author, licence, original file). */
  sourceUrl: string;
  source: string;
  license: string;
  licenseUrl: string | null;
};

export type LibraryPhoto = {
  url: string;
  alt: string;
  width: number;
  height: number;
  credit: PhotoCredit;
};

export type LibraryVideo = {
  src: string;
  srcMobile: string;
  poster: string;
  title: string;
  credit: PhotoCredit;
};

type Library = {
  /** Tour gallery per destination (area slug), cover first. */
  destinations: Record<string, LibraryPhoto[]>;
  /** Single photos for named slots (home sections, about page, ...). */
  slots: Record<string, LibraryPhoto>;
  /** About page gallery. */
  aboutGallery: (LibraryPhoto & { area: string })[];
  /** Blog covers by post slug. */
  blog: Record<string, LibraryPhoto>;
  heroVideo: LibraryVideo;
};

export const library = data as unknown as Library;

/** Destination of a tour from its slug, for tours saved without an area. */
const SLUG_HINTS: [RegExp, string][] = [
  [/fageda|castellfollit|garrotxa|besalu/, "la-garrotxa"],
  [/nuria|queralbs|ripolles/, "ripolles"],
  [/aiguestortes|maurici|pallars/, "pallars"],
  [/rupit|tavertet|osona/, "osona"],
  [/alquezar|vero|guara|huesca/, "huesca"],
];

/** Gallery for a tour's destination, or null when the library has none. */
export function destinationPhotos(
  areaSlug: string | null | undefined,
  tourSlug?: string,
): LibraryPhoto[] | null {
  const area =
    (areaSlug && library.destinations[areaSlug] ? areaSlug : null) ??
    SLUG_HINTS.find(([re]) => tourSlug && re.test(tourSlug))?.[1];
  if (!area) return null;
  const list = library.destinations[area];
  return list && list.length > 0 ? list : null;
}

export function slotPhoto(name: string): LibraryPhoto | null {
  return library.slots[name] ?? null;
}

export function blogCover(slug: string): LibraryPhoto | null {
  return library.blog[slug] ?? null;
}
