"use client";

/*
 * Photo grid with a full-screen viewer, adapted from Opensource UI gallery
 * patterns (MIT, © 2026 Bidyut Kundu; see THIRD_PARTY_NOTICES.md). The
 * viewer is a native <dialog>: focus trap, Escape and inert page for free.
 */
import { ChevronLeft, ChevronRight, Grid3x3, X } from "lucide-react";
import Image from "next/image";
import { PhotoCredit } from "@/components/ui/photo-credit";
import { useCallback, useEffect, useRef, useState } from "react";
import { iconButtonClasses } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import { useT } from "@/components/i18n/provider";
import type { TourImage } from "@/lib/tours/types";

/*
 * Wide-first product gallery: one large 16:9 photo with a thumbnail strip
 * underneath (desktop) and a swipeable, scroll-snapped track (mobile).
 * The track is the single source of truth: arrows and thumbnails scroll it,
 * and the active index is read back from its scroll position.
 */
export function Gallery({ images, title }: { images: TourImage[]; title: string }) {
  const t = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Where a smooth scroll is heading, so rapid arrow clicks don't read a stale index.
  const target = useRef<number | null>(null);
  const total = images.length;

  const goTo = useCallback((index: number) => {
    const el = track.current;
    if (!el) return;
    const i = Math.max(0, Math.min(index, el.children.length - 1));
    target.current = i;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const pos = el.scrollLeft / Math.max(1, el.clientWidth);
        if (target.current !== null && Math.abs(pos - target.current) < 0.02) target.current = null;
        setActive(Math.round(pos));
      });
    };
    const onTouch = () => {
      target.current = null;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("touchstart", onTouch, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("touchstart", onTouch);
    };
  }, []);

  // Keep the active thumbnail visible in the strip.
  useEffect(() => {
    const strip = thumbsRef.current;
    const thumb = strip?.children[active] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    const visible =
      thumb.offsetLeft >= strip.scrollLeft &&
      thumb.offsetLeft + thumb.clientWidth <= strip.scrollLeft + strip.clientWidth;
    if (visible) return;
    const left = thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2;
    strip.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  if (total === 0) return null;

  const open = (index = 0) => {
    dialog.current?.showModal();
    document.getElementById(`foto-${index}`)?.scrollIntoView({ block: "start" });
  };

  const step = (delta: number) => goTo((target.current ?? active) + delta);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    }
  };

  const arrow =
    "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-md ring-1 ring-black/5 transition hover:bg-white disabled:pointer-events-none disabled:opacity-0 md:flex";

  return (
    <>
      <div className="mt-6">
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label={t("Fotos: {title}", { title })}
          className="group relative -mx-4 overflow-hidden bg-secondary sm:mx-0 sm:rounded-xl"
        >
          <div
            ref={track}
            tabIndex={0}
            onKeyDown={onKey}
            className="flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] focus-visible:outline-offset-[-3px] sm:aspect-[16/9] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => open(i)}
                aria-label={t("Foto {n} de {total}", { n: i + 1, total })}
                className="relative h-full w-full shrink-0 snap-center snap-always cursor-zoom-in"
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  priority={i === 0}
                  loading={i === 0 ? undefined : "lazy"}
                  sizes="(min-width: 1080px) 760px, 100vw"
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={active === 0}
                aria-label={t("Foto anterior")}
                className={cn(arrow, "left-3")}
              >
                <ChevronLeft aria-hidden size={20} />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={active === total - 1}
                aria-label={t("Foto siguiente")}
                className={cn(arrow, "right-3")}
              >
                <ChevronRight aria-hidden size={20} />
              </button>
              <span
                aria-live="polite"
                className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-semibold text-white tabular-nums"
              >
                {active + 1} / {total}
              </span>
              <button
                type="button"
                onClick={() => open(active)}
                className="absolute right-3 bottom-3 hidden h-9 items-center gap-2 rounded-lg bg-primary px-3 ring-1 ring-primary ring-inset text-sm font-semibold text-primary shadow-lg hover:bg-secondary sm:inline-flex"
              >
                <Grid3x3 aria-hidden size={16} />
                {t("Mostrar las {n} fotos", { n: total })}
              </button>
            </>
          )}
          <PhotoCredit credit={images[active]?.credit} className="top-3 right-3 bottom-auto" />
        </div>

        {total > 1 && (
          <div
            ref={thumbsRef}
            className="mt-3 hidden gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] sm:flex"
          >
            {images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => goTo(i)}
                aria-label={t("Foto {n} de {total}", { n: i + 1, total })}
                aria-current={i === active ? "true" : undefined}
                className={cn(
                  "relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg bg-secondary transition md:w-24",
                  i === active
                    ? "ring-2 ring-brand-600 ring-offset-2"
                    : "opacity-70 hover:opacity-100",
                )}
              >
                <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            ))}
          </div>
        )}

        {total > 1 && (
          <button
            type="button"
            onClick={() => open(active)}
            className="mt-3 inline-flex h-9 items-center gap-2 text-sm font-semibold text-brand-secondary sm:hidden"
          >
            <Grid3x3 aria-hidden size={16} />
            {t("Mostrar las {n} fotos", { n: total })}
          </button>
        )}
      </div>

      <dialog
        ref={dialog}
        aria-label={t("Fotos: {title}", { title })}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-white p-0 backdrop:bg-ink/60"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-secondary bg-white px-4 py-3">
          <p className="truncate text-sm font-semibold">{title}</p>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label={t("Cerrar fotos")}
            className={iconButtonClasses("soft", "md")}
          >
            <X aria-hidden size={18} />
          </button>
        </div>
        <ul className="mx-auto grid max-w-3xl gap-4 p-4">
          {images.map((img, i) => (
            <li key={img.url} id={`foto-${i}`} className="scroll-mt-20">
              <figure>
                <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-secondary">
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    sizes="(min-width: 768px) 736px, 100vw"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
                {(img.alt || img.credit) && (
                  <figcaption className="mt-2 text-caption text-tertiary">
                    {img.alt}
                    {img.credit && (
                      <>
                        {img.alt ? " · " : ""}
                        <a
                          href={img.credit.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline-offset-2 hover:underline"
                        >
                          © {img.credit.author} · {img.credit.license} · {img.credit.source}
                        </a>
                      </>
                    )}
                  </figcaption>
                )}
              </figure>
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
