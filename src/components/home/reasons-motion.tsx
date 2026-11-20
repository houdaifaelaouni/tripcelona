"use client";

/*
 * "Por qué Tripcelona" motion: as the list scrolls in, each reason card
 * slides up, its colour bar grows and its icon tile pops in with a small
 * spin. Skipped for visitors who ask for reduced motion.
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function ReasonsMotion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-reason]");
      cards.forEach((card, i) => {
        const tl = gsap.timeline({
          delay: (i % 2) * 0.12,
          scrollTrigger: { trigger: card, start: "top 90%", once: true },
        });
        tl.from(card, { y: 36, autoAlpha: 0, duration: 0.6, ease: "power3.out" })
          .from(
            card.querySelector("[data-reason-bar]"),
            { scaleY: 0, transformOrigin: "50% 0%", duration: 0.5, ease: "power2.out" },
            "-=0.35",
          )
          .from(
            card.querySelector("[data-reason-icon]"),
            { scale: 0, rotation: -25, duration: 0.55, ease: "back.out(2.2)" },
            "-=0.45",
          );
      });
    },
    { scope: ref },
  );
  return (
    <ul ref={ref} className={className}>
      {children}
    </ul>
  );
}
