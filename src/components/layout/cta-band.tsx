import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";

/** Closing call-to-action band from the wireframe kit,. */
export function CtaBand({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <section className="container-site py-12 md:py-16">
      <Reveal>
        <div
          data-reveal
          className="overflow-hidden rounded-3xl bg-secondary p-6 ring-1 ring-secondary ring-inset md:p-10"
        >
          <div>
            <h2 className="text-2xl leading-[1.15] font-semibold tracking-[-0.03em] text-primary md:text-[2rem]">
              {title}
            </h2>
            <p className="mt-3 max-w-xl text-lg text-tertiary">{text}</p>
            <div className="mt-6 flex flex-wrap gap-3">{children}</div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
