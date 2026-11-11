"use client";

/*
 * Scroll animations with GSAP + ScrollTrigger (free, standard GSAP licence).
 * Content renders visible on the server; animations only start after
 * hydration and are skipped for visitors who ask for reduced motion.
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fades and lifts every `[data-reveal]` child into view as the block scrolls in. */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (reduced()) return;
      const items = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      if (items.length === 0) return;
      gsap.from(items, {
        y: 32,
        autoAlpha: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
      });
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Counts a number up from zero when it scrolls into view. */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    const state = { n: 0 };
    gsap.to(state, {
      n: value,
      duration: 1.6,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
      onUpdate: () => {
        el.textContent = `${Math.round(state.n)}${suffix}`;
      },
    });
  });
  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

/** Draws SVG strokes marked `[data-draw]` and pops `[data-pop]` dots in. */
export function DrawOnScroll({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (reduced()) return;
      const paths = gsap.utils.toArray<SVGPathElement>("[data-draw]");
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: "top 75%", once: true },
      });
      paths.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      tl.to(paths, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut", stagger: 0.15 });
      tl.from(
        "[data-pop]",
        { scale: 0, transformOrigin: "50% 50%", duration: 0.4, ease: "back.out(2)", stagger: 0.08 },
        "-=0.6",
      );
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Hero entrance: headline, copy and actions slide in once on load. */
export function HeroIntro({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (reduced()) return;
      gsap.from("[data-intro]", {
        y: 24,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1,
      });
      gsap.to("[data-float]", {
        y: -10,
        duration: 3,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 0.6,
      });
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
