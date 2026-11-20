"use client";

/*
 * Hero "next departure" ticket motion: the ticket drops in with a small
 * swing, the perforation draws across, then it floats gently. Skipped for
 * visitors who ask for reduced motion (the ticket just renders in place).
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(useGSAP);

export function TicketMotion({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const tl = gsap.timeline({ delay: 0.35 });
      tl.from(ref.current, {
        y: -48,
        rotation: -6,
        autoAlpha: 0,
        transformOrigin: "50% 0%",
        duration: 0.9,
        ease: "back.out(1.6)",
      })
        .from("[data-ticket-photo] img", { scale: 1.18, duration: 1.4, ease: "power2.out" }, 0)
        .from(
          "[data-ticket-perf]",
          { scaleX: 0, transformOrigin: "0% 50%", duration: 0.5, ease: "power2.inOut" },
          "-=0.45",
        )
        .from(
          "[data-ticket-stub] > *",
          { y: 10, autoAlpha: 0, stagger: 0.06, duration: 0.4, ease: "power2.out" },
          "-=0.25",
        )
        .to(ref.current, {
          y: -6,
          rotation: 0.6,
          duration: 2.6,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
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
