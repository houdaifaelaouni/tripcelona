import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";

/** Closing call-to-action band from the wireframe kit, with an animated illustration. */
export function CtaBand({
  title,
  text,
  art,
  children,
}: {
  title: string;
  text: string;
  art: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="container-site py-12 md:py-16">
      <Reveal>
        <div
          data-reveal
          data-art-host
          className="grid items-center gap-8 overflow-hidden rounded-3xl bg-secondary p-6 ring-1 ring-secondary ring-inset md:grid-cols-[1fr_280px] md:p-10"
        >
          <div>
            <h2 className="text-2xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2rem]">
              {title}
            </h2>
            <p className="mt-3 max-w-xl text-lg text-tertiary">{text}</p>
            <div className="mt-6 flex flex-wrap gap-3">{children}</div>
          </div>
          <div className="mx-auto hidden w-full max-w-[280px] md:block">{art}</div>
        </div>
      </Reveal>
    </section>
  );
}
