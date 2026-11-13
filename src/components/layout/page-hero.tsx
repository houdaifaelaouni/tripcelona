import type { ReactNode } from "react";
import { HeroIntro } from "@/components/motion/reveal";
import { cn } from "@/lib/cn";

/**
 * Inner-page hero from the wireframe kit's split hero: eyebrow, H1, intro and
 * actions on the left, a hover-animated 2D illustration on the right.
 */
export function PageHero({
  eyebrow,
  title,
  intro,
  art,
  children,
  compact,
}: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  art: ReactNode;
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <header className="relative overflow-hidden border-b border-secondary bg-secondary">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(37,99,235,0.10),transparent_45%)]"
      />
      <div
        className={cn(
          "container-site relative grid items-center gap-8 md:grid-cols-[1.25fr_1fr] md:gap-12",
          compact ? "py-8 md:py-10" : "py-10 md:py-14",
        )}
      >
        <HeroIntro>
          <p data-intro className="text-[13px] font-medium tracking-[0.03em] text-brand-secondary">
            {eyebrow}
          </p>
          <h1
            data-intro
            className="mt-3 text-3xl leading-[1.1] font-semibold tracking-[-0.035em] text-primary md:text-[2.75rem]"
          >
            {title}
          </h1>
          {intro && (
            <p data-intro className="mt-4 max-w-xl text-lg text-tertiary">
              {intro}
            </p>
          )}
          {children && (
            <div data-intro className="mt-6 flex flex-wrap gap-3">
              {children}
            </div>
          )}
        </HeroIntro>
        <div
          data-art-host
          className="mx-auto hidden w-full max-w-[340px] rounded-3xl bg-white p-3 shadow-lg ring-1 ring-secondary transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none md:block"
        >
          {art}
        </div>
      </div>
    </header>
  );
}
