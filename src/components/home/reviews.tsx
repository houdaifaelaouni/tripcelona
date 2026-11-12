import { Quote, Star } from "lucide-react";
import type { Review } from "@/lib/reviews/queries";

/**
 * Approved reviews from the `reviews` table (Google, Tripadvisor, ...).
 * Renders nothing until the owner has approved at least one review, so the
 * home page never shows invented testimonials.
 */
export function Reviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  return (
    <section aria-labelledby="opiniones-heading" className="bg-secondary py-16 md:py-24">
      <div className="container-site">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-brand-secondary md:text-md">
            Lo que dicen de nosotros
          </p>
          <h2
            id="opiniones-heading"
            className="mt-3 text-3xl leading-[1.2] font-semibold tracking-tight text-primary md:text-4xl"
          >
            Opiniones
          </h2>
        </div>

        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="flex flex-col gap-4 rounded-panel bg-primary p-6 shadow-xs ring-1 ring-secondary ring-inset"
            >
              <div className="flex items-center justify-between gap-4">
                <Quote aria-hidden className="size-6 shrink-0 text-brand-secondary" />
                {review.rating && (
                  <span className="flex items-center gap-1 text-yellow">
                    {Array.from({ length: review.rating }, (_, i) => (
                      <Star key={i} aria-hidden className="size-4 fill-current" />
                    ))}
                    <span className="sr-only">{review.rating} de 5 estrellas</span>
                  </span>
                )}
              </div>
              <blockquote className="flex-1 text-md text-secondary">{review.text}</blockquote>
              <footer>
                <p className="text-sm font-semibold text-primary">{review.author}</p>
                <p className="text-sm text-tertiary">{review.source}</p>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
