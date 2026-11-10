import { site } from "@/lib/site";
import type { TourDetail } from "@/lib/tours/types";
import { siteUrl } from "./site-url";

type Json = Record<string, unknown>;

export function organizationJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: site.name,
    url: siteUrl(),
    telephone: site.phoneDisplay.replace(/\s/g, ""),
    // TODO(PO): logo URL and legal address once supplied.
    areaServed: "Cataluña",
  };
}

export function websiteJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: siteUrl(),
    inLanguage: "es",
  };
}

/** TouristTrip with one Offer per upcoming departure (FR-28). No ratings: none are real yet. */
export function tourJsonLd(tour: TourDetail): Json {
  const url = `${siteUrl()}/excursiones/${tour.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.title,
    url,
    description: tour.seoDescription ?? tour.summary ?? undefined,
    image: tour.images.slice(0, 5).map((i) => i.url),
    touristType: "Grupos",
    itinerary: tour.itinerary.length
      ? {
          "@type": "ItemList",
          itemListElement: tour.itinerary.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.title,
          })),
        }
      : undefined,
    provider: { "@type": "TravelAgency", name: site.name, url: siteUrl() },
    offers: tour.departures.map((d) => ({
      "@type": "Offer",
      url,
      price: (d.priceCents / 100).toFixed(2),
      priceCurrency: "EUR",
      availability:
        d.status === "open" && d.seatsLeft > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
      availabilityStarts: d.startsAt,
      inventoryLevel: { "@type": "QuantitativeValue", value: d.seatsLeft },
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]): Json | null {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function blogPostingJsonLd(post: {
  slug: string;
  title: string;
  excerpt: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  updatedAt: string;
  cover: { url: string } | null;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt,
    image: post.cover ? [post.cover.url] : undefined,
    mainEntityOfPage: `${siteUrl()}/blog/${post.slug}`,
    inLanguage: "es",
    publisher: { "@type": "Organization", name: site.name, url: siteUrl() },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${siteUrl()}${it.path}`,
    })),
  };
}

/** Serialises for a <script type="application/ld+json">, escaping "<" so content can't close the tag. */
export function jsonLdScript(data: Json | Json[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
