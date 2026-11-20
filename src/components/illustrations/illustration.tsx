"use client";

/*
 * Animated spot illustration. The SVG renders fully drawn on the server, so it
 * shows without JavaScript; after hydration GSAP draws the marked strokes in
 * when the scene scrolls into view, pops the accents and runs small loops
 * (float, sway, spin). Loops only run while the scene is on screen, and
 * nothing moves for visitors who ask for reduced motion.
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { SCENES, type SceneName } from "./scenes";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type { SceneName };

export function Illustration({
  name,
  className,
  play = "scroll",
}: {
  name: SceneName;
  className?: string;
  /** "scroll" waits until the scene is in view; "load" plays right away (above the fold). */
  play?: "scroll" | "load";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const Scene = SCENES[name];

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const q = gsap.utils.selector(root);
      const svg = root.querySelector("svg");

      const enter = gsap.timeline({
        paused: play === "scroll",
        defaults: { ease: "power2.out" },
      });
      enter.from(svg, { y: 14, autoAlpha: 0, duration: 0.6 });
      const strokes = Array.from(root.querySelectorAll<SVGGeometryElement>("[data-draw]"));
      strokes.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      if (strokes.length)
        enter.to(
          strokes,
          { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut", stagger: 0.12 },
          "-=0.3",
        );
      const pops = q("[data-pop]");
      if (pops.length)
        enter.from(
          pops,
          {
            scale: 0,
            transformOrigin: "50% 50%",
            duration: 0.45,
            ease: "back.out(2.2)",
            stagger: 0.06,
          },
          "-=0.8",
        );

      const loop = gsap.timeline({ paused: true });
      q("[data-float]").forEach((el, i) =>
        loop.to(
          el,
          { y: -6, duration: 2.2 + (i % 3) * 0.5, ease: "sine.inOut", repeat: -1, yoyo: true },
          i * 0.35,
        ),
      );
      q("[data-sway]").forEach((el, i) =>
        loop.fromTo(
          el,
          { rotation: 0 },
          {
            rotation: Number(el.getAttribute("data-sway")) || 6,
            transformOrigin: el.getAttribute("data-origin") ?? "50% 100%",
            duration: 0.9 + (i % 2) * 0.3,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          },
          0,
        ),
      );
      q("[data-spin]").forEach((el) =>
        loop.to(
          el,
          { rotation: 360, transformOrigin: "50% 50%", duration: 2.4, ease: "none", repeat: -1 },
          0,
        ),
      );
      q("[data-bob]").forEach((el) =>
        loop.to(el, { y: -2.5, duration: 0.4, ease: "sine.inOut", repeat: -1, yoyo: true }, 0),
      );
      q("[data-twinkle]").forEach((el, i) =>
        loop.to(
          el,
          {
            scale: 0.7,
            transformOrigin: "50% 50%",
            duration: 0.8,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          },
          i * 0.25,
        ),
      );

      ScrollTrigger.create({
        trigger: root,
        start: "top 88%",
        end: "bottom top",
        onEnter: () => enter.play(),
        onEnterBack: () => enter.play(),
        // Loops pause off screen so a page full of scenes stays cheap.
        onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
      });
      if (play === "load") enter.play();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} aria-hidden className={cn("pointer-events-none select-none", className)}>
      <Scene className="h-full w-full" />
    </div>
  );
}
