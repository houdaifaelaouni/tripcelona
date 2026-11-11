"use client";

/*
 * Horizontal photo journal: large rounded photos with captions in one
 * draggable, scroll-snapping row, a "03 / 12" counter and prev/next
 * buttons. Works with mouse drag, touch swipe, trackpad and keyboard
 * (the row is focusable and the buttons move one photo). GSAP slides the
 * photos in once; nothing animates under reduced motion.
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type GalleryPhoto = {
  url: string;
  alt: string;
  title: string;
  area: string | null;
  href: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [index, setIndex] = useState(0);

  const step = useCallback(() => {
    const first = track.current?.querySelector("li");
    return first ? first.getBoundingClientRect().width + 24 : 400;
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / step()));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [step]);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from("[data-photo]", {
        x: 120,
        autoAlpha: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.07,
        scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
      });
    },
    { scope: root },
  );

  const go = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * step(), behavior: "smooth" });

  // Mouse drag (touch and trackpads already scroll natively).
  const onDown = (e: PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || !track.current) return;
    drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false };
    track.current.style.scrollSnapType = "none";
  };
  const onMove = (e: PointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    if (!d || !track.current) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    track.current.scrollLeft = d.left - dx;
  };
  const onUp = () => {
    const el = track.current;
    if (!drag.current || !el) return;
    const moved = drag.current.moved;
    drag.current = null;
    el.style.scrollSnapType = "";
    el.scrollTo({ left: Math.round(el.scrollLeft / step()) * step(), behavior: "smooth" });
    if (moved) {
      // Swallow the click that ends a drag so it doesn't open the tour.
      el.addEventListener("click", (ev) => ev.preventDefault(), { capture: true, once: true });
    }
  };

  return (
    <div ref={root}>
      <div className="container-site flex items-center justify-end gap-4">
        <p className="mr-auto font-mono text-sm text-tertiary" aria-live="polite">
          <span className="text-lg font-semibold text-primary">{pad(index + 1)}</span> /{" "}
          {pad(photos.length)}
        </p>
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Foto anterior"
          className="flex size-11 items-center justify-center rounded-full bg-primary text-fg-secondary shadow-xs ring-1 ring-primary transition ring-inset hover:bg-primary_hover"
        >
          <ArrowLeft aria-hidden className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Foto siguiente"
          className="flex size-11 items-center justify-center rounded-full bg-brand-solid text-white shadow-xs-skeuomorphic transition hover:bg-brand-solid_hover"
        >
          <ArrowRight aria-hidden className="size-5" />
        </button>
      </div>
      <ul
        ref={track}
        tabIndex={0}
        aria-label="Galería de fotos de las excursiones"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        className="scrollbar-hide mt-8 flex cursor-grab snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-[max(16px,calc((100vw_-_1280px)/2_+_16px))] scroll-px-[max(16px,calc((100vw_-_1280px)/2_+_16px))] pb-4 select-none active:cursor-grabbing"
      >
        {photos.map((p, i) => (
          <li
            key={`${p.url}-${i}`}
            data-photo
            className="group w-[78vw] max-w-[420px] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw]"
          >
            <Link href={p.href} draggable={false} className="block focus-visible:outline-offset-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-secondary">
                <Image
                  src={p.url}
                  alt={p.alt}
                  fill
                  draggable={false}
                  sizes="(min-width: 1128px) 30vw, (min-width: 640px) 46vw, 78vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
                />
                <span className="absolute top-4 left-4 rounded-full bg-black/40 px-2.5 py-1 font-mono text-xs text-white backdrop-blur">
                  {pad(i + 1)}
                </span>
              </div>
              <p className="mt-4 text-lg font-semibold text-primary group-hover:underline">
                {p.title}
              </p>
              {p.area && <p className="text-sm text-tertiary">{p.area}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
