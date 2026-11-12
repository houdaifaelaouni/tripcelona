export type Departure = {
  id: string;
  startsAt: string; // ISO
  endsAt: string | null;
  seatsLeft: number;
  priceCents: number;
  status: "open" | "sold_out" | "cancelled";
};

export type TourImage = { url: string; alt: string };

export type TourSummary = {
  slug: string;
  title: string;
  /** Short one-line pitch shown on cards. */
  summary: string | null;
  area: string | null;
  areaSlug: string | null;
  difficulty: string | null;
  durationMinutes: number | null;
  priceFromCents: number | null;
  image: TourImage | null;
  /** Every published photo of the tour, in order (home gallery). */
  gallery?: TourImage[];
  /** Upcoming departures (open or sold out), soonest first. */
  departures: Departure[];
};

export type TourDetail = TourSummary & {
  summary: string | null;
  description: import("@/lib/content/rich-text").RichDoc | null;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  packingList: string[];
  meetingPoint: string | null;
  mapUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  images: TourImage[];
  itinerary: { title: string; timeLabel: string | null; body: string | null }[];
  faqs: { question: string; answer: string }[];
};
