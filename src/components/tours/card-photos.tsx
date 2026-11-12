"use client";

/*
 * Photo carousel for tour cards: stacked images cross-fading in place, with
 * prev/next buttons and dots (client-side only, no extra dependencies). The
 * buttons sit above the card's stretched link so they stay clickable.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { TourImage } from "@/lib/tours/types";

export type CardDate = { weekday: string; day: string; month: string };

export function CardPhotos({
  images,
  date,
  badge,
  priority = false,
}: {
  images: TourImage[];
  /** Date tile shown top-left (SÁB / 14 / NOV). */
  date?: CardDate | null;
  /** Badge shown top-right (sold out, last seats). */
  badge?: ReactNode;
  priority?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  if (count === 0) {
    return <div aria-hidden className="aspect-[4/3] bg-secondary" />;
  }

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count);

  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
      {images.map((img, i) => (
        <Image
          key={`${img.url}-${i}`}
          src={img.url}
          alt={i === index ? img.alt : ""}
          fill
          priority={priority && i === 0}
          sizes="(min-width: 1440px) 400px, (min-width: 1128px) 33vw, (min-width: 744px) 46vw, 92vw"
          className={cn(
            "object-cover transition-opacity duration-300 motion-reduce:transition-none",
            i === index ? "opacity-100" : "opacity-0",
          )}
        />
      ))}

      {date && (
        <span
          aria-hidden
          className="absolute top-3 left-3 z-10 flex min-w-14 flex-col items-center rounded-xl bg-white px-2.5 py-1.5 text-center shadow-md"
        >
          <small className="text-[11px] leading-4 font-semibold text-brand-secondary uppercase">
            {date.weekday}
          </small>
          <strong className="text-xl leading-6 font-bold text-primary">{date.day}</strong>
          <small className="text-[11px] leading-4 font-semibold text-brand-secondary uppercase">
            {date.month}
          </small>
        </span>
      )}

      {badge && <span className="absolute top-3 right-3 z-10">{badge}</span>}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Foto anterior"
            className="absolute top-1/2 left-2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm ring-1 ring-black/5 transition hover:bg-white motion-reduce:transition-none"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Foto siguiente"
            className="absolute top-1/2 right-2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm ring-1 ring-black/5 transition hover:bg-white motion-reduce:transition-none"
          >
            <ChevronRight aria-hidden className="size-5" />
          </button>
          <span
            aria-hidden
            className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5"
          >
            {images.map((img, i) => (
              <i
                key={`${img.url}-dot-${i}`}
                className={cn(
                  "size-1.5 rounded-full shadow-sm",
                  i === index ? "bg-white" : "bg-white/55",
                )}
              />
            ))}
          </span>
        </>
      )}
    </div>
  );
}
