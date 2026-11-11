"use client";

/**
 * Right-hand side of the split login: a photo carousel of our published
 * tours, built on the Untitled UI Carousel (MIT, © 2025 Untitled UI,
 * vendored in src/components/uui; Embla under the hood).
 */
import { ArrowLeft, ArrowRight } from "@untitledui/icons";
import Image from "next/image";
import { Carousel } from "@/components/uui/application/carousel/carousel-base";
import { cx } from "@/components/uui/utils/cx";
import { WelcomeIllustration } from "./illustrations";

export type Slide = { url: string; alt: string; title: string; area: string | null };

export function LoginCarousel({ slides }: { slides: Slide[] }) {
  if (!slides.length)
    return (
      <div className="flex h-full items-end bg-brand-section p-12">
        <WelcomeIllustration className="w-full rounded-2xl bg-primary/90" />
      </div>
    );
  return (
    <Carousel.Root opts={{ loop: true }} className="relative h-full">
      <Carousel.Content overflowHidden className="h-full">
        {slides.map((s) => (
          <Carousel.Item key={s.url} className="relative h-full min-h-dvh basis-full">
            <Image src={s.url} alt={s.alt} fill sizes="50vw" className="object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-12 text-white">
              <p className="text-3xl leading-9 font-semibold">{s.title}</p>
              {s.area && <p className="mt-2 text-lg text-white/80">{s.area}</p>}
            </div>
          </Carousel.Item>
        ))}
      </Carousel.Content>
      <div className="absolute right-12 bottom-14 flex gap-3">
        <Carousel.PrevTrigger className="flex size-12 items-center justify-center rounded-full text-white ring-1 ring-white/30 ring-inset hover:bg-primary/10">
          <ArrowLeft aria-hidden className="size-5" />
          <span className="sr-only">Foto anterior</span>
        </Carousel.PrevTrigger>
        <Carousel.NextTrigger className="flex size-12 items-center justify-center rounded-full text-white ring-1 ring-white/30 ring-inset hover:bg-primary/10">
          <ArrowRight aria-hidden className="size-5" />
          <span className="sr-only">Foto siguiente</span>
        </Carousel.NextTrigger>
      </div>
      <Carousel.IndicatorGroup className="absolute top-10 left-12 flex gap-2" aria-label="Fotos">
        {({ index }) => (
          <Carousel.Indicator
            key={index}
            index={index}
            className={({ isSelected }) =>
              cx("h-1 w-10 rounded-full", isSelected ? "bg-primary" : "bg-primary/40")
            }
          />
        )}
      </Carousel.IndicatorGroup>
    </Carousel.Root>
  );
}
