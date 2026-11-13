"use client";

/*
 * Original 2D illustrations (inline SVG, no external assets) that present a
 * section and come alive with GSAP when the visitor hovers or focuses them.
 * Hovering the illustration, or any ancestor marked `data-art-host`, plays
 * the animation; leaving reverses it. A slow idle float runs meanwhile.
 * Reduced-motion visitors get the still drawing. Decorative: aria-hidden.
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(useGSAP);

const BLUE = "#2563eb";
const SKY = "#dbe7fe";
const PALE = "#eef4ff";
const INK = "#0f1011";
const LINE = "#d0d6e0";
const SUN = "#f5b942";

type Build = (tl: gsap.core.Timeline, q: (s: string) => HTMLElement[]) => void;

function Art({
  children,
  build,
  className,
  viewBox = "0 0 240 180",
}: {
  children: ReactNode;
  build: Build;
  className?: string;
  viewBox?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  useGSAP(
    () => {
      const svg = ref.current;
      if (!svg || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const q = (s: string) => gsap.utils.toArray<HTMLElement>(s, svg);
      gsap.to(q("[data-idle]"), {
        y: -5,
        duration: 2.6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 0.5,
      });
      const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
      build(tl, q);
      const host = (svg.closest("[data-art-host]") as HTMLElement | null) ?? svg;
      const play = () => tl.timeScale(1).play();
      const back = () => tl.timeScale(1.6).reverse();
      host.addEventListener("pointerenter", play);
      host.addEventListener("pointerleave", back);
      host.addEventListener("focusin", play);
      host.addEventListener("focusout", back);
      return () => {
        host.removeEventListener("pointerenter", play);
        host.removeEventListener("pointerleave", back);
        host.removeEventListener("focusin", play);
        host.removeEventListener("focusout", back);
      };
    },
    { scope: ref },
  );
  return (
    <svg ref={ref} aria-hidden viewBox={viewBox} className={className} fill="none">
      {children}
    </svg>
  );
}

const origin = { transformOrigin: "50% 50%", transformBox: "fill-box" } as const;

/** Coach on a mountain road: excursions with transport included. */
export function CoachArt({ className }: { className?: string }) {
  return (
    <Art
      className={className}
      build={(tl, q) => {
        tl.to(q("[data-coach]"), { x: 70, duration: 1.2, ease: "power2.inOut" }, 0)
          .to(q("[data-rays]"), { rotate: 90, duration: 1.2 }, 0)
          .to(q("[data-far]"), { x: -10, duration: 1.2 }, 0)
          .to(q("[data-wheel]"), { rotate: 360, duration: 1.2, ease: "none" }, 0);
      }}
    >
      <rect width="240" height="180" rx="16" fill={PALE} />
      <g data-rays style={origin}>
        <circle cx="190" cy="42" r="16" fill={SUN} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <rect
            key={a}
            x="188"
            y="14"
            width="4"
            height="9"
            rx="2"
            fill={SUN}
            transform={`rotate(${a} 190 42)`}
          />
        ))}
      </g>
      <g data-far>
        <path d="M-10 128 L50 66 L86 104 L122 52 L176 118 L176 140 L-10 140Z" fill={SKY} />
        <path d="M110 140 L168 80 L212 124 L250 96 L250 140Z" fill="#b9d0fb" />
      </g>
      <path d="M0 142 H240 V180 H0Z" fill={INK} />
      <path d="M0 161 H240" stroke="#fff" strokeWidth="2.5" strokeDasharray="14 12" />
      <g data-coach data-idle>
        <rect x="30" y="112" width="86" height="34" rx="9" fill="#fff" stroke={LINE} />
        <rect x="30" y="134" width="86" height="12" rx="5" fill={BLUE} />
        {[38, 60, 82].map((x) => (
          <rect key={x} x={x} y="118" width="16" height="12" rx="3" fill="#93b8fd" />
        ))}
        <rect x="102" y="118" width="10" height="16" rx="3" fill="#93b8fd" />
        {[48, 98].map((cx) => (
          <g key={cx} data-wheel style={origin}>
            <circle cx={cx} cy="148" r="8" fill={INK} />
            <circle cx={cx} cy="148" r="3" fill="#fff" />
            <path d={`M${cx} 142 V154`} stroke="#fff" strokeWidth="1.5" />
          </g>
        ))}
      </g>
    </Art>
  );
}

/** Phone with a ticket and a check: book online in two minutes. */
export function TicketArt({ className }: { className?: string }) {
  return (
    <Art
      className={className}
      build={(tl, q) => {
        tl.to(q("[data-ticket]"), { y: -22, rotate: -4, duration: 0.5 }, 0)
          .fromTo(
            q("[data-check]"),
            { strokeDashoffset: 1 },
            { immediateRender: false, strokeDashoffset: 0, duration: 0.5 },
            0.15,
          )
          .fromTo(
            q("[data-spark]"),
            { scale: 0 },
            { scale: 1, stagger: 0.08, duration: 0.35, ease: "back.out(3)", ...origin },
            0.3,
          );
      }}
    >
      <rect width="240" height="180" rx="16" fill={PALE} />
      <g data-idle>
        <rect x="82" y="22" width="76" height="142" rx="14" fill={INK} />
        <rect x="88" y="34" width="64" height="118" rx="8" fill="#fff" />
        <rect x="96" y="104" width="48" height="8" rx="4" fill={LINE} />
        <rect x="96" y="120" width="32" height="8" rx="4" fill={LINE} />
        <rect x="96" y="134" width="48" height="12" rx="6" fill={BLUE} />
        <g data-ticket>
          <rect
            x="94"
            y="44"
            width="52"
            height="44"
            rx="8"
            fill={SKY}
            stroke={BLUE}
            strokeWidth="1.5"
          />
          <circle cx="94" cy="66" r="5" fill="#fff" />
          <circle cx="146" cy="66" r="5" fill="#fff" />
          <path
            d="M108 66 l7 7 l15 -15"
            stroke={BLUE}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="0.0001"
            data-check
          />
        </g>
      </g>
      {[
        [58, 50],
        [182, 80],
        [62, 128],
        [176, 36],
      ].map(([x, y], i) => (
        <circle key={i} data-spark cx={x} cy={y} r="5" fill={i % 2 ? SUN : BLUE} />
      ))}
    </Art>
  );
}

/** Mountain with a flag and a hiker: day trips into the Pyrenees. */
export function HikerArt({ className }: { className?: string }) {
  return (
    <Art
      className={className}
      build={(tl, q) => {
        tl.to(q("[data-hiker]"), { x: 34, y: -46, duration: 1.1, ease: "power1.inOut" }, 0)
          .to(
            q("[data-flag]"),
            {
              rotate: 14,
              duration: 0.25,
              repeat: 3,
              yoyo: true,
              ...{ transformOrigin: "0% 50%", transformBox: "fill-box" },
            },
            0.7,
          )
          .to(q("[data-cloud]"), { x: 16, duration: 1.1 }, 0);
      }}
    >
      <rect width="240" height="180" rx="16" fill={PALE} />
      <g data-cloud data-idle fill="#fff">
        <ellipse cx="60" cy="40" rx="24" ry="8" />
        <ellipse cx="78" cy="34" rx="16" ry="8" />
      </g>
      <path d="M-4 168 L84 70 L128 118 L162 78 L244 168Z" fill="#b9d0fb" />
      <path d="M40 168 L128 44 L224 168Z" fill={BLUE} />
      <path d="M128 44 L146 70 L134 66 L124 78 L112 66 L108 70Z" fill="#fff" />
      <path d="M128 44 V24" stroke={INK} strokeWidth="2" />
      <path data-flag d="M128 24 H146 L140 30 L146 36 H128Z" fill={SUN} />
      <g data-hiker>
        <circle cx="86" cy="140" r="5" fill={INK} />
        <path
          d="M86 146 V160 M86 150 L80 158 M86 150 L92 156 M86 160 L81 168 M86 160 L92 168"
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="83" y="146" width="6" height="9" rx="2" fill={SUN} />
      </g>
      <path d="M0 168 H240 V180 H0Z" fill="#8fb1f2" opacity="0.5" />
    </Art>
  );
}

/** Four friends: private groups, companies and associations. */
export function GroupArt({ className }: { className?: string }) {
  const people: [number, string][] = [
    [62, BLUE],
    [102, SUN],
    [142, INK],
    [182, "#93b8fd"],
  ];
  return (
    <Art
      className={className}
      build={(tl, q) => {
        tl.to(
          q("[data-person]"),
          { y: -14, duration: 0.3, stagger: 0.09, yoyo: true, repeat: 1, ease: "power2.out" },
          0,
        ).fromTo(
          q("[data-heart]"),
          { scale: 0, autoAlpha: 0 },
          {
            scale: 1,
            autoAlpha: 1,
            y: -10,
            stagger: 0.1,
            duration: 0.4,
            ease: "back.out(3)",
            ...origin,
          },
          0.2,
        );
      }}
    >
      <rect width="240" height="180" rx="16" fill={PALE} />
      <ellipse cx="120" cy="156" rx="96" ry="9" fill={SKY} />
      {people.map(([x, c], i) => (
        <g key={x} data-person style={origin}>
          <circle cx={x} cy="86" r="14" fill="#fff" stroke={LINE} />
          <circle cx={x - 4} cy="85" r="1.8" fill={INK} />
          <circle cx={x + 4} cy="85" r="1.8" fill={INK} />
          <path
            d={`M${x - 4} 91 Q${x} 95 ${x + 4} 91`}
            stroke={INK}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path d={`M${x - 18} 152 V124 a18 18 0 0 1 36 0 V152Z`} fill={c} />
          <path
            d={`M${x - 14} 82 a14 14 0 0 1 28 0 Q${x} 74 ${x - 14} 82Z`}
            fill={i % 2 ? INK : "#7a4a2b"}
          />
        </g>
      ))}
      {[82, 122, 162].map((x) => (
        <path
          key={x}
          data-heart
          d={`M${x} 56 c-6 -7 -14 1 -6 8 l6 5 l6 -5 c8 -7 0 -15 -6 -8Z`}
          fill="#ef5d5d"
          opacity="0"
        />
      ))}
    </Art>
  );
}

/** Two chat bubbles: contact and WhatsApp. */
export function ChatArt({ className }: { className?: string }) {
  return (
    <Art
      className={className}
      build={(tl, q) => {
        tl.fromTo(
          q("[data-bubble]"),
          { scale: 0.85 },
          {
            immediateRender: false,
            scale: 1,
            stagger: 0.12,
            duration: 0.4,
            ease: "back.out(3)",
            ...origin,
          },
          0,
        )
          .fromTo(
            q("[data-dot]"),
            { y: 0 },
            { y: -5, stagger: 0.1, duration: 0.25, repeat: 3, yoyo: true },
            0.3,
          )
          .to(
            q("[data-ok]"),
            { scale: 1, autoAlpha: 1, duration: 0.35, ease: "back.out(3)", ...origin },
            0.9,
          );
      }}
    >
      <rect width="240" height="180" rx="16" fill={PALE} />
      <g data-bubble data-idle>
        <path
          d="M34 34 h110 a12 12 0 0 1 12 12 v38 a12 12 0 0 1 -12 12 h-74 l-20 16 v-16 h-16 a12 12 0 0 1 -12 -12 v-38 a12 12 0 0 1 12 -12Z"
          fill="#fff"
          stroke={LINE}
        />
        <rect x="46" y="52" width="70" height="7" rx="3.5" fill={LINE} />
        <rect x="46" y="68" width="46" height="7" rx="3.5" fill={LINE} />
      </g>
      <g data-bubble>
        <path
          d="M96 108 h110 a12 12 0 0 1 12 12 v22 a12 12 0 0 1 -12 12 h-14 v14 l-18 -14 h-78 a12 12 0 0 1 -12 -12 v-22 a12 12 0 0 1 12 -12Z"
          fill={BLUE}
        />
        {[142, 156, 170].map((x) => (
          <circle key={x} data-dot cx={x} cy="131" r="4" fill="#fff" />
        ))}
      </g>
      <g data-ok style={{ opacity: 0 }}>
        <circle cx="206" cy="42" r="14" fill="#22a06b" />
        <path
          d="M199 42 l5 5 l9 -10"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </Art>
  );
}

/** Calendar with a highlighted day: weekly departures. */
export function CalendarArt({ className }: { className?: string }) {
  const days = Array.from({ length: 14 }, (_, i) => i);
  return (
    <Art
      className={className}
      build={(tl, q) => {
        tl.to(q("[data-day]"), { fill: SKY, stagger: 0.03, duration: 0.15 }, 0)
          .to(
            q("[data-sun]"),
            { fill: BLUE, scale: 1.25, duration: 0.35, ease: "back.out(3)", ...origin },
            0.5,
          )
          .to(q("[data-ring]"), { rotate: -8, duration: 0.3, stagger: 0.05 }, 0);
      }}
    >
      <rect width="240" height="180" rx="16" fill={PALE} />
      <g data-idle>
        <rect x="40" y="30" width="160" height="126" rx="14" fill="#fff" stroke={LINE} />
        <path d="M40 60 a14 14 0 0 1 14 -30 h132 a14 14 0 0 1 14 30Z" fill={BLUE} />
        {[70, 170].map((x) => (
          <rect key={x} data-ring x={x - 3} y="22" width="6" height="18" rx="3" fill={INK} />
        ))}
        {days.map((i) => {
          const x = 58 + (i % 7) * 20;
          const y = 78 + Math.floor(i / 7) * 32;
          const sun = i % 7 === 6;
          return (
            <rect
              key={i}
              data-day={!sun || undefined}
              data-sun={sun || undefined}
              x={x}
              y={y}
              width="14"
              height="14"
              rx="4"
              fill={sun ? SUN : "#f1f2f4"}
            />
          );
        })}
      </g>
    </Art>
  );
}

/** Question bubbles with a light bulb: frequently asked questions. */
export function FaqArt({ className }: { className?: string }) {
  return (
    <Art
      className={className}
      build={(tl, q) => {
        tl.to(
          q("[data-q]"),
          { y: -12, rotate: 10, stagger: 0.12, duration: 0.3, yoyo: true, repeat: 1, ...origin },
          0,
        )
          .to(q("[data-bulb]"), { fill: SUN, duration: 0.3 }, 0.4)
          .fromTo(
            q("[data-glow]"),
            { scale: 0, autoAlpha: 0 },
            { scale: 1, autoAlpha: 0.6, duration: 0.4, ...origin },
            0.4,
          );
      }}
    >
      <rect width="240" height="180" rx="16" fill={PALE} />
      <g data-idle>
        <rect x="32" y="40" width="110" height="64" rx="14" fill="#fff" stroke={LINE} />
        <path d="M58 104 l-4 18 l22 -18Z" fill="#fff" stroke={LINE} />
        <rect x="46" y="58" width="80" height="7" rx="3.5" fill={LINE} />
        <rect x="46" y="74" width="54" height="7" rx="3.5" fill={LINE} />
      </g>
      <text
        data-q
        x="164"
        y="70"
        fontSize="40"
        fontWeight="700"
        fill={BLUE}
        fontFamily="Inter, system-ui, sans-serif"
      >
        ?
      </text>
      <text
        data-q
        x="190"
        y="110"
        fontSize="26"
        fontWeight="700"
        fill="#93b8fd"
        fontFamily="Inter, system-ui, sans-serif"
      >
        ?
      </text>
      <circle data-glow cx="82" cy="140" r="26" fill={SUN} opacity="0" />
      <g>
        <path
          data-bulb
          d="M82 124 a14 14 0 0 1 8 25 v6 h-16 v-6 a14 14 0 0 1 8 -25Z"
          fill="#fff"
          stroke={INK}
          strokeWidth="2"
        />
        <path d="M76 160 h12" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </Art>
  );
}

/** Dotted route between pins: build your own tour. */
export function RouteArt({ className }: { className?: string }) {
  return (
    <Art
      className={className}
      build={(tl, q) => {
        tl.fromTo(
          q("[data-route]"),
          { clipPath: "inset(0 100% 0 0)" },
          {
            clipPath: "inset(0 0% 0 0)",
            duration: 1,
            ease: "power1.inOut",
            immediateRender: false,
          },
          0,
        ).fromTo(
          q("[data-pin]"),
          { y: -24, autoAlpha: 0 },
          {
            immediateRender: false,
            y: 0,
            autoAlpha: 1,
            stagger: 0.3,
            duration: 0.4,
            ease: "bounce.out",
          },
          0.1,
        );
      }}
    >
      <rect width="240" height="180" rx="16" fill={PALE} />
      <path
        d="M20 40 H220 M20 90 H220 M20 140 H220 M60 20 V160 M120 20 V160 M180 20 V160"
        stroke="#fff"
        strokeWidth="6"
      />
      <path
        data-route
        pathLength="1"
        strokeDasharray="0.04 0.05"
        d="M52 134 C80 80 100 150 122 96 S176 56 192 48"
        stroke={BLUE}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {[
        [52, 134, BLUE],
        [122, 96, SUN],
        [192, 48, "#ef5d5d"],
      ].map(([x, y, c]) => (
        <g key={String(x)} data-pin>
          <path
            d={`M${x} ${Number(y) + 4} c-12 -14 -12 -14 -12 -22 a12 12 0 0 1 24 0 c0 8 0 8 -12 22Z`}
            fill={c as string}
          />
          <circle cx={x as number} cy={Number(y) - 18} r="4.5" fill="#fff" />
        </g>
      ))}
    </Art>
  );
}

/** Open journal and pen: the blog. */
export function JournalArt({ className }: { className?: string }) {
  return (
    <Art
      className={className}
      build={(tl, q) => {
        tl.fromTo(
          q("[data-line]"),
          { scaleX: 0 },
          {
            immediateRender: false,
            scaleX: 1,
            stagger: 0.15,
            duration: 0.35,
            transformOrigin: "0% 50%",
            transformBox: "fill-box",
          },
          0,
        ).to(q("[data-pen]"), { x: 14, y: -6, rotate: -8, duration: 1, ...origin }, 0);
      }}
    >
      <rect width="240" height="180" rx="16" fill={PALE} />
      <g data-idle>
        <path d="M40 46 q40 -10 80 6 v96 q-40 -16 -80 -6Z" fill="#fff" stroke={LINE} />
        <path d="M200 46 q-40 -10 -80 6 v96 q40 -16 80 -6Z" fill="#fff" stroke={LINE} />
        <rect x="54" y="70" width="52" height="8" rx="4" fill={SKY} />
        {[88, 104, 120].map((y, i) => (
          <rect key={y} data-line x="54" y={y} width={52 - i * 8} height="6" rx="3" fill={LINE} />
        ))}
        <rect x="134" y="66" width="52" height="30" rx="6" fill={BLUE} opacity="0.9" />
        <path d="M140 90 l12 -12 l10 8 l8 -10 l10 14Z" fill="#fff" opacity="0.9" />
        {[108, 124].map((y) => (
          <rect key={y} data-line x="134" y={y} width="44" height="6" rx="3" fill={LINE} />
        ))}
      </g>
      <g data-pen>
        <rect
          x="150"
          y="118"
          width="46"
          height="8"
          rx="4"
          fill={INK}
          transform="rotate(-35 173 122)"
        />
        <path d="M144 140 l6 -4 l-2 6Z" fill={SUN} />
      </g>
    </Art>
  );
}

/** Location pin with ripples: the meeting point. */
export function PinArt({ className }: { className?: string }) {
  return (
    <Art
      className={className}
      build={(tl, q) => {
        tl.fromTo(
          q("[data-drop]"),
          { y: -30 },
          { immediateRender: false, y: 0, duration: 0.6, ease: "bounce.out" },
          0,
        ).fromTo(
          q("[data-ripple]"),
          { scale: 0.3, autoAlpha: 0.8 },
          {
            immediateRender: false,
            scale: 1.4,
            autoAlpha: 0,
            stagger: 0.25,
            duration: 0.8,
            ...origin,
          },
          0.35,
        );
      }}
    >
      <rect width="240" height="180" rx="16" fill={PALE} />
      <path d="M0 120 H240 M0 70 H240 M70 0 V180 M150 0 V180" stroke="#fff" strokeWidth="8" />
      <rect x="86" y="30" width="48" height="34" rx="6" fill={SKY} />
      <rect x="160" y="96" width="50" height="30" rx="6" fill={SKY} />
      {[0, 1].map((i) => (
        <ellipse
          key={i}
          data-ripple
          cx="120"
          cy="132"
          rx="34"
          ry="11"
          stroke={BLUE}
          strokeWidth="2.5"
          fill="none"
          opacity="0"
        />
      ))}
      <ellipse cx="120" cy="132" rx="14" ry="5" fill={INK} opacity="0.18" />
      <g data-drop>
        <path
          d="M120 134 c-22 -26 -22 -26 -22 -40 a22 22 0 0 1 44 0 c0 14 0 14 -22 40Z"
          fill={BLUE}
        />
        <circle cx="120" cy="94" r="8" fill="#fff" />
      </g>
    </Art>
  );
}
