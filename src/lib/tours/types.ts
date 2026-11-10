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
  area: string | null;
  areaSlug: string | null;
  difficulty: string | null;
  durationMinutes: number | null;
  priceFromCents: number | null;
  image: TourImage | null;
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
