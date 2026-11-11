/**
 * Small spot illustrations for the admin (empty states, the dashboard
 * greeting and the tour editor). Original drawings in the Tripcelona palette,
 * flat shapes with a navy line, after the "hand-illustrated" spot art the
 * design file describes. All are decorative: aria-hidden, no text inside.
 */
import type { SVGProps } from "react";

const C = {
  navy: "var(--color-navy)",
  blue: "var(--color-blue)",
  yellow: "var(--color-yellow)",
  tint: "#e6f0f9",
  tint2: "#cfe1f3",
  white: "#fff",
};

type Props = SVGProps<SVGSVGElement>;
const base = (p: Props) => ({
  viewBox: "0 0 240 160",
  fill: "none",
  "aria-hidden": true,
  focusable: false,
  ...p,
});
const line = {
  stroke: C.navy,
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Hills, sun and a dotted walking route ending in a pin. */
export function RouteIllustration(p: Props) {
  return (
    <svg {...base(p)}>
      <ellipse cx="120" cy="138" rx="104" ry="12" fill={C.tint} />
      <circle cx="176" cy="44" r="18" fill={C.yellow} />
      <path d="M16 132 L78 58 L112 96 L138 70 L224 132 Z" fill={C.tint2} />
      <path d="M16 132 L78 58 L112 96 L138 70 L224 132" {...line} />
      <path
        d="M66 72 L78 58 L90 72 L84 70 L78 76 L72 70 Z"
        fill={C.white}
        {...line}
        strokeWidth={2}
      />
      <path
        d="M36 130 C60 118 70 124 92 116 S128 98 150 108 S182 112 192 92"
        stroke={C.navy}
        strokeWidth={2.5}
        strokeDasharray="1 7"
        strokeLinecap="round"
      />
      <path d="M192 92 c-9 0 -14 -7 -14 -13 a14 14 0 0 1 28 0 c0 6 -5 13 -14 13 Z" fill={C.blue} />
      <path d="M192 92 l0 6" {...line} />
      <circle cx="192" cy="79" r="4.5" fill={C.white} />
      <path d="M30 40 h18 M38 32 v16" stroke={C.blue} strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
}

/** A wall calendar with one day circled. */
export function CalendarIllustration(p: Props) {
  const days = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 5; c++)
      days.push(<circle key={`${r}${c}`} cx={84 + c * 18} cy={78 + r * 18} r="3" fill={C.tint2} />);
  return (
    <svg {...base(p)}>
      <ellipse cx="120" cy="140" rx="90" ry="11" fill={C.tint} />
      <rect x="64" y="32" width="112" height="100" rx="14" fill={C.white} {...line} />
      <path d="M64 58 h112 V46 a14 14 0 0 0 -14 -14 H78 a14 14 0 0 0 -14 14 Z" fill={C.navy} />
      <path d="M90 24 v16 M150 24 v16" {...line} strokeWidth={4} />
      {days}
      <circle cx="138" cy="96" r="11" fill={C.yellow} />
      <path d="M133 96 l3.5 3.5 l6.5 -7" {...line} />
      <path
        d="M188 52 l6 -6 M196 64 h9 M30 92 h12 M36 86 v12"
        stroke={C.blue}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Two tickets, one stamped. */
export function TicketsIllustration(p: Props) {
  const ticket =
    "M0 0 h96 a8 8 0 0 0 0 16 v14 a8 8 0 0 0 0 16 v14 H0 v-14 a8 8 0 0 0 0 -16 v-14 a8 8 0 0 0 0 -16 Z";
  return (
    <svg {...base(p)}>
      <ellipse cx="120" cy="140" rx="92" ry="11" fill={C.tint} />
      <g transform="translate(58 54) rotate(-10)">
        <path d={ticket} fill={C.tint2} {...line} />
      </g>
      <g transform="translate(86 46) rotate(6)">
        <path d={ticket} fill={C.white} {...line} />
        <path d="M70 6 v54" stroke={C.navy} strokeWidth={2} strokeDasharray="3 5" />
        <path d="M14 18 h40 M14 30 h28" {...line} />
        <circle cx="34" cy="46" r="10" fill={C.yellow} />
      </g>
      <path
        d="M44 40 l-8 -6 M48 30 l-2 -10 M198 108 l10 2 M194 120 l7 7"
        stroke={C.blue}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** An open envelope with a letter and a paper plane. */
export function InboxIllustration(p: Props) {
  return (
    <svg {...base(p)}>
      <ellipse cx="116" cy="140" rx="92" ry="11" fill={C.tint} />
      <rect x="78" y="34" width="76" height="70" rx="6" fill={C.white} {...line} />
      <path d="M90 52 h52 M90 64 h40 M90 76 h46" {...line} stroke={C.blue} />
      <path
        d="M58 72 L116 108 L174 72 V128 a6 6 0 0 1 -6 6 H64 a6 6 0 0 1 -6 -6 Z"
        fill={C.tint2}
        {...line}
      />
      <path d="M58 128 L104 100 M174 128 L128 100" {...line} />
      <path d="M176 30 L214 18 L196 56 L188 42 Z" fill={C.yellow} {...line} />
      <path d="M188 42 L214 18" {...line} />
      <path
        d="M150 50 c10 -4 18 -10 26 -16"
        stroke={C.navy}
        strokeWidth={2}
        strokeDasharray="2 6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A notebook and pencil. */
export function NotebookIllustration(p: Props) {
  return (
    <svg {...base(p)}>
      <ellipse cx="120" cy="140" rx="90" ry="11" fill={C.tint} />
      <rect x="70" y="26" width="92" height="108" rx="10" fill={C.white} {...line} />
      <path d="M86 26 v108" stroke={C.navy} strokeWidth={2.5} />
      {[46, 60, 74].map((y) => (
        <circle key={y} cx="70" cy={y} r="4" fill={C.navy} />
      ))}
      <path
        d="M100 52 h46 M100 68 h40 M100 84 h46 M100 100 h28"
        {...line}
        stroke={C.tint2}
        strokeWidth={4}
      />
      <g transform="translate(150 118) rotate(-45)">
        <rect x="0" y="-7" width="66" height="14" rx="3" fill={C.yellow} {...line} />
        <path d="M0 -7 L-14 0 L0 7 Z" fill={C.white} {...line} />
        <rect x="56" y="-7" width="10" height="14" rx="2" fill={C.blue} />
      </g>
    </svg>
  );
}

/** Stacked photos with a mountain inside. */
export function PhotosIllustration(p: Props) {
  return (
    <svg {...base(p)}>
      <ellipse cx="120" cy="140" rx="90" ry="11" fill={C.tint} />
      <rect
        x="60"
        y="40"
        width="96"
        height="76"
        rx="10"
        fill={C.tint2}
        {...line}
        transform="rotate(-8 108 78)"
      />
      <rect x="84" y="34" width="100" height="80" rx="10" fill={C.white} {...line} />
      <path d="M94 104 L124 70 L142 90 L154 78 L174 104 Z" fill={C.blue} />
      <circle cx="160" cy="54" r="8" fill={C.yellow} />
    </svg>
  );
}

/** A van on a coastal road with hills and the sun: the dashboard greeting. */
export function WelcomeIllustration(p: Props) {
  return (
    <svg {...base(p)} viewBox="0 0 320 160">
      <circle cx="248" cy="46" r="24" fill={C.yellow} />
      <path
        d="M0 112 C40 72 76 70 112 96 C146 60 190 58 236 98 C262 84 292 86 320 104 V160 H0 Z"
        fill={C.tint2}
      />
      <path d="M0 130 C80 116 220 116 320 128 V160 H0 Z" fill={C.tint} />
      <path
        d="M0 136 C80 122 220 122 320 134"
        stroke={C.white}
        strokeWidth={3}
        strokeDasharray="14 12"
      />
      <g transform="translate(108 84)">
        <path
          d="M6 14 a10 10 0 0 1 10 -10 h56 c10 0 18 6 22 16 l6 14 v12 a4 4 0 0 1 -4 4 H6 Z"
          fill={C.blue}
          {...line}
        />
        <path
          d="M22 10 h22 v16 H16 v-10 a6 6 0 0 1 6 -6 Z M52 10 h18 c6 0 10 6 12 16 H52 Z"
          fill={C.white}
          {...line}
          strokeWidth={2}
        />
        <path d="M6 34 h94" stroke={C.navy} strokeWidth={2} />
        <circle cx="26" cy="50" r="9" fill={C.navy} />
        <circle cx="26" cy="50" r="3.5" fill={C.white} />
        <circle cx="80" cy="50" r="9" fill={C.navy} />
        <circle cx="80" cy="50" r="3.5" fill={C.white} />
        <rect x="96" y="36" width="5" height="6" rx="2" fill={C.yellow} />
      </g>
      <path
        d="M30 40 h14 M37 33 v14 M286 108 l6 -4"
        stroke={C.blue}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

export const ILLUSTRATIONS = {
  route: RouteIllustration,
  calendar: CalendarIllustration,
  tickets: TicketsIllustration,
  inbox: InboxIllustration,
  notebook: NotebookIllustration,
  photos: PhotosIllustration,
} as const;
export type IllustrationName = keyof typeof ILLUSTRATIONS;
