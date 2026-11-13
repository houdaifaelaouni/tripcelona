"use client";

/*
 * Site-wide motion, built with the GSAP skills' patterns: useGSAP with a
 * scope, gsap.matchMedia so everything is skipped (and reverted) for visitors
 * who ask for reduced motion, ScrollTrigger.batch for staggered entrances,
 * and only transform/opacity so nothing triggers layout.
 *
 * Opacity (never visibility) is animated, so hidden blocks stay focusable for
 * keyboard users. Content is always visible on the server and without JavaScript. Only blocks
 * that start below the fold are hidden and revealed on scroll, and inline
 * styles are cleared when each tween ends (a leftover transform would turn the
 * block into a containing block and break sticky/fixed children).
 *
 * Opt-outs / hooks (plain attributes, no props):
 *   data-no-motion   skip this element and everything inside it
 *   data-reveal / data-intro keep their own animations
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** What gets a scroll entrance, by structure so every page benefits. */
const TARGETS = [
  "main section :is(h2, h3)",
  "main article",
  "main figure",
  "main form",
  "main table",
  "main details",
  "main aside > div",
  "main blockquote",
  "footer nav",
  "footer ul[aria-label]",
].join(",");

const SKIP =
  "[data-no-motion], [data-reveal], [data-intro], [data-reveal] *, [data-intro] *, dialog, dialog *";

export function SiteMotion() {
  const pathname = usePathname();
  const bar = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", (ctx) => {
        const main = document.querySelector<HTMLElement>("main");
        if (!main) return;

        // Route enter: a short fade so page changes do not pop.
        gsap.fromTo(
          main,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: "power2.out",
            clearProps: "opacity,transform",
          },
        );

        // Scroll progress bar.
        if (bar.current) {
          gsap.fromTo(
            bar.current,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: {
                trigger: document.documentElement,
                start: "top top",
                end: "max",
                scrub: 0.3,
              },
            },
          );
        }

        // Header gains a hairline shadow once the page scrolls.
        const header = document.querySelector<HTMLElement>("body > header, header[class*=sticky]");
        if (header) {
          ScrollTrigger.create({
            start: 8,
            end: "max",
            onToggle: (self) => header.setAttribute("data-scrolled", String(self.isActive)),
          });
        }

        // Staggered entrance for blocks below the fold, including ones that
        // stream in later (Suspense): scan again when the tree changes.
        const seen = new WeakSet<Element>();
        const doScan = () => {
          const fresh = gsap.utils
            .toArray<HTMLElement>(TARGETS)
            .filter(
              (el) =>
                !seen.has(el) &&
                !el.matches(SKIP) &&
                !el.closest("[data-no-motion]") &&
                el.getBoundingClientRect().top > window.innerHeight * 0.92,
            );
          fresh.forEach((el) => seen.add(el));
          if (fresh.length === 0) return;
          gsap.set(fresh, { opacity: 0, y: 28 });
          ScrollTrigger.batch(fresh, {
            start: "top 90%",
            once: true,
            interval: 0.1,
            batchMax: 6,
            onEnter: (batch) =>
              gsap.to(batch, {
                opacity: 1,
                y: 0,
                duration: 0.7,
                ease: "power3.out",
                stagger: 0.09,
                overwrite: true,
                clearProps: "opacity,transform",
              }),
          });
        };
        // Registered on the media-query context so later scans are reverted with it.
        ctx.add("scan", doScan);
        const scan = () => (ctx as unknown as { scan: () => void }).scan();

        scan();
        let timer: ReturnType<typeof setTimeout> | undefined;
        const observer = new MutationObserver(() => {
          clearTimeout(timer);
          timer = setTimeout(scan, 120);
        });
        observer.observe(main, { childList: true, subtree: true });

        return () => {
          observer.disconnect();
          clearTimeout(timer);
        };
      });
      return () => mm.revert();
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return (
    <div
      ref={bar}
      aria-hidden
      data-no-motion
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left scale-x-0 bg-brand-solid"
    />
  );
}
