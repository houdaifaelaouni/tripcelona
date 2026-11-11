"use client";

/*
 * Photo grid with a full-screen viewer, adapted from Opensource UI gallery
 * patterns (MIT, © 2026 Bidyut Kundu; see THIRD_PARTY_NOTICES.md). The
 * viewer is a native <dialog>: focus trap, Escape and inert page for free.
 */
import { Grid3x3, X } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { iconButtonClasses } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import type { TourImage } from "@/lib/tours/types";

export function Gallery({ images, title }: { images: TourImage[]; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [main, ...rest] = images;
  if (!main) return null;
  const thumbs = rest.slice(0, 4);

  const open = (index = 0) => {
    dialog.current?.showModal();
    document.getElementById(`foto-${index}`)?.scrollIntoView({ block: "start" });
  };

  return (
    <>
      <div className="relative mt-6 grid gap-2 overflow-hidden rounded-xl md:grid-cols-4 md:grid-rows-2">
        <button
          type="button"
          onClick={() => open(0)}
          className={cn(
            "relative aspect-[4/3] bg-secondary focus-visible:outline-offset-[-3px]",
            thumbs.length > 0 ? "md:col-span-2 md:row-span-2 md:aspect-auto" : "md:col-span-4",
          )}
        >
          <Image
            src={main.url}
            alt={main.alt}
            fill
            priority
            sizes="(min-width: 1080px) 540px, 100vw"
            className="object-cover transition-opacity hover:opacity-90"
          />
        </button>
        {thumbs.map((img, i) => (
          <button
            key={img.url}
            type="button"
            onClick={() => open(i + 1)}
            className="relative hidden aspect-[4/3] bg-secondary focus-visible:outline-offset-[-3px] md:block"
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              sizes="270px"
              className="object-cover transition-opacity hover:opacity-90"
            />
          </button>
        ))}
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => open(0)}
            className="absolute right-3 bottom-3 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 ring-1 ring-primary ring-inset text-sm font-semibold text-primary shadow-lg hover:bg-secondary"
          >
            <Grid3x3 aria-hidden size={16} />
            Mostrar las {images.length} fotos
          </button>
        )}
      </div>

      <dialog
        ref={dialog}
        aria-label={`Fotos: ${title}`}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-white p-0 backdrop:bg-ink/60"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-secondary bg-white px-4 py-3">
          <p className="truncate text-sm font-semibold">{title}</p>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Cerrar fotos"
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
                {img.alt && (
                  <figcaption className="mt-2 text-caption text-tertiary">{img.alt}</figcaption>
                )}
              </figure>
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
