"use client";

/*
 * Opinions carousel: a row of cards that scrolls with snap points and two
 * arrow buttons. Only real opinions approved in the admin are shown, and the
 * section does not render at all until there is at least one.
 */
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useRef, useState } from "react";
import type { Review } from "@/lib/content/queries";
import { useT } from "@/components/i18n/provider";
import { SectionHeader } from "./sections";

const LONG = 240;

function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

function ReviewCard({ review }: { review: Review }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const long = review.text.length > LONG;
  return (
    <li className="w-[85%] shrink-0 snap-start sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
      <figure className="flex h-full flex-col rounded-3xl bg-primary p-7 shadow-lg ring-1 ring-secondary ring-inset">
        <svg aria-hidden viewBox="0 0 32 24" className="h-6 w-8 text-brand-300" fill="currentColor">
          <path d="M0 24V14.4C0 6.4 4.5 1.3 12 0l1.6 3.2C9.7 4.5 8 7 7.8 10H13v14H0Zm19 0V14.4C19 6.4 23.5 1.3 31 0l1.6 3.2c-3.9 1.3-5.6 3.8-5.8 6.8H32v14H19Z" />
        </svg>
        {review.rating && (
          <p
            className="mt-4 flex gap-0.5"
            role="img"
            aria-label={t("{n} de 5 estrellas", { n: review.rating })}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                aria-hidden
                className={
                  i < review.rating!
                    ? "size-4 fill-[#f5b942] text-[#f5b942]"
                    : "size-4 text-quaternary"
                }
              />
            ))}
          </p>
        )}
        <blockquote
          className={
            "mt-4 text-md whitespace-pre-line text-secondary " + (open ? "" : "line-clamp-6")
          }
        >
          {review.text}
        </blockquote>
        {long && (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="mt-3 self-start rounded-md text-md font-medium text-brand-secondary hover:underline"
          >
            {open ? t("Leer menos") : t("Leer más")}
          </button>
        )}
        <figcaption className="mt-auto flex items-center gap-3 pt-6">
          <span
            aria-hidden
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-fg-brand-primary ring-1 ring-brand-200/60 ring-inset"
          >
            {initials(review.author)}
          </span>
          <span>
            <span className="block font-semibold text-primary">{review.author}</span>
            <span className="block text-sm text-tertiary">{review.source}</span>
          </span>
        </figcaption>
      </figure>
    </li>
  );
}

export function Testimonials({ reviews }: { reviews: Review[] }) {
  const t = useT();
  const track = useRef<HTMLUListElement>(null);
  if (reviews.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li")?.getBoundingClientRect().width ?? el.clientWidth;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * (card + 24), behavior: reduce ? "auto" : "smooth" });
  };
  const arrow =
    "flex size-12 items-center justify-center rounded-full bg-primary text-primary shadow-xs ring-1 ring-primary ring-inset transition hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";

  return (
    <section
      aria-labelledby="opiniones-heading"
      className="border-t border-secondary py-16 md:py-24"
    >
      <div className="container-site">
        <SectionHeader
          id="opiniones-heading"
          eyebrow={t("Lo que dicen de nosotros")}
          title={t("Opiniones")}
          action={
            reviews.length > 1 ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  aria-label={t("Opiniones anteriores")}
                  onClick={() => scrollBy(-1)}
                  className={arrow}
                >
                  <ChevronLeft aria-hidden className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label={t("Más opiniones")}
                  onClick={() => scrollBy(1)}
                  className={arrow}
                >
                  <ChevronRight aria-hidden className="size-5" />
                </button>
              </div>
            ) : undefined
          }
        />
        <ul
          ref={track}
          tabIndex={0}
          aria-label={t("Opiniones de clientes")}
          className="mt-10 flex snap-x snap-mandatory items-stretch gap-6 overflow-x-auto scroll-smooth pb-6 [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden"
        >
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </ul>
      </div>
    </section>
  );
}
