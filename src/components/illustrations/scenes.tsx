/**
 * Tripcelona spot illustrations: original line-art scenes drawn for this site
 * in a "Brooklyn"-like style (navy outline, flat cyan/navy fills, small yellow
 * accents, simple characters). They are NOT Streamline assets: every path here
 * was written by hand for Tripcelona.
 *
 * Animation hooks (read by ./illustration.tsx, all optional):
 *   data-draw     stroke draws itself in when the scene scrolls into view
 *   data-pop      scales in after the drawing
 *   data-float    gentle up/down loop
 *   data-sway     small rotation loop; degrees in the value, origin in data-origin
 *   data-spin     continuous rotation (wheels, clock hand)
 *   data-bob      quick small bounce (a bus on the road)
 *   data-twinkle  pulsing sparkle
 * Every scene is decorative: aria-hidden, no text inside.
 */
import type { ReactNode, SVGProps } from "react";

const L = "var(--color-navy, #04224b)";
const B = "var(--color-cyan, #009fe3)";
const N = "var(--color-blue, #003882)";
const Y = "var(--color-yellow, #fcb92c)";
const T = "#e3f4fc";
const W = "#fff";

const line = {
  stroke: L,
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

type Props = SVGProps<SVGSVGElement>;

function Svg({ children, ...p }: Props & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 320 240" fill="none" aria-hidden focusable={false} {...p}>
      {children}
    </svg>
  );
}

/* ---------- small building blocks ---------- */

function Ground({ rx = 136 }: { rx?: number }) {
  return <ellipse cx="160" cy="214" rx={rx} ry="12" fill={T} />;
}

/** Thick outlined limb: a navy stroke under a coloured one. */
function Limb({ d, color, w = 9 }: { d: string; color: string; w?: number }) {
  return (
    <>
      <path d={d} stroke={L} strokeWidth={w + 5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function Hand({ at }: { at: [number, number] }) {
  return <circle cx={at[0]} cy={at[1]} r="4.5" fill={W} {...line} />;
}

function Sparkle({ x, y, s = 1, c = Y }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <g data-pop>
      <path
        data-twinkle
        d={`M${x} ${y - 8 * s} Q${x + 1.5 * s} ${y - 1.5 * s} ${x + 8 * s} ${y} Q${x + 1.5 * s} ${y + 1.5 * s} ${x} ${y + 8 * s} Q${x - 1.5 * s} ${y + 1.5 * s} ${x - 8 * s} ${y} Q${x - 1.5 * s} ${y - 1.5 * s} ${x} ${y - 8 * s}Z`}
        fill={c}
        {...line}
        strokeWidth={2}
      />
    </g>
  );
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g data-float transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M-26 8 a10 10 0 0 1 4 -19 a14 14 0 0 1 26 -4 a11 11 0 0 1 20 9 a8 8 0 0 1 2 14 Z"
        fill={W}
        {...line}
      />
    </g>
  );
}

function Pin({ x, y, c = Y }: { x: number; y: number; c?: string }) {
  return (
    <g data-float>
      <g data-pop>
        <path
          d={`M${x} ${y} c-4 -9 -13 -15 -13 -25 a13 13 0 0 1 26 0 c0 10 -9 16 -13 25z`}
          fill={c}
          {...line}
        />
        <circle cx={x} cy={y - 25} r="4.5" fill={W} {...line} strokeWidth={2} />
      </g>
    </g>
  );
}

type Arm = { d: string; hand: [number, number]; sway?: number; origin?: string };

/**
 * A simple character with feet at (0,0) in its own space, about 110 units tall.
 * `back` draws behind the body (a backpack), `front` in front of the torso but
 * under the arms (a map held in both hands).
 */
function Person({
  x,
  y,
  s = 1,
  flip = false,
  shirt = B,
  pants = N,
  hair = "short",
  arms,
  back,
  front,
}: {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  shirt?: string;
  pants?: string;
  hair?: "short" | "long" | "hat";
  arms: Arm[];
  back?: ReactNode;
  front?: ReactNode;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {back}
      <Limb d="M-7 -44 L-9 -6" color={pants} w={10} />
      <Limb d="M7 -44 L9 -6" color={pants} w={10} />
      <ellipse cx="-11" cy="-3" rx="8.5" ry="4.5" fill={L} />
      <ellipse cx="11" cy="-3" rx="8.5" ry="4.5" fill={L} />
      <path d="M-16 -80 Q0 -88 16 -80 L19 -40 H-19 Z" fill={shirt} {...line} />
      {hair === "long" && <path d="M-14 -97 a14 14 0 0 1 28 0 v17 h-28 z" fill={L} />}
      <circle cx="0" cy="-98" r="12" fill={W} {...line} />
      {hair === "hat" ? (
        <>
          <path d="M-10 -106 a10 9 0 0 1 20 0 z" fill={Y} {...line} />
          <path d="M-16 -106 H16" {...line} />
        </>
      ) : (
        <path d="M-11.3 -102 A12 12 0 0 1 11.3 -102 Q0 -107 -11.3 -102 Z" fill={L} {...line} />
      )}
      <circle cx="-4" cy="-96" r="1.5" fill={L} />
      <circle cx="4" cy="-96" r="1.5" fill={L} />
      <path d="M-3.5 -91 q3.5 2.5 7 0" {...line} strokeWidth={2} />
      {front}
      {arms.map((a) => (
        <g key={a.d} data-sway={a.sway} data-origin={a.origin}>
          <Limb d={a.d} color={shirt} w={8} />
          <Hand at={a.hand} />
        </g>
      ))}
    </g>
  );
}

const armDownL: Arm = { d: "M-13 -76 Q-19 -64 -20 -50", hand: [-20, -48] };
const armDownR: Arm = { d: "M13 -76 Q19 -64 20 -50", hand: [20, -48] };

/* ---------- scenes ---------- */

/** Coach on the road with travellers in the windows and someone waving. */
export function BusScene(p: Props) {
  return (
    <Svg {...p}>
      <Ground />
      <path d="M30 196 L92 122 L130 160 L176 108 L262 196 Z" fill={T} />
      <g data-float>
        <circle cx="262" cy="52" r="17" fill={Y} {...line} />
      </g>
      <Cloud x={70} y={56} />
      <path data-draw d="M22 206 H298" {...line} />
      <path data-draw d="M34 132 H56" {...line} />
      <path data-draw d="M26 148 H54" {...line} />
      <path data-draw d="M38 164 H58" {...line} />
      <g data-bob>
        <rect x="68" y="104" width="176" height="80" rx="16" fill={B} {...line} />
        <path d="M70 158 H242" stroke={Y} strokeWidth="7" />
        <path d="M70 154 H242 M70 163 H242" {...line} strokeWidth={2} />
        {[84, 120, 156, 192].map((x) => (
          <rect key={x} x={x} y="116" width="28" height="28" rx="5" fill={W} {...line} />
        ))}
        <rect x="226" y="116" width="14" height="36" rx="5" fill={W} {...line} />
        {/* travellers in the windows */}
        <circle cx="98" cy="138" r="7" fill={W} {...line} strokeWidth={2} />
        <path d="M91 138 a7 7 0 0 1 14 0 c-4 -2.5 -10 -2.5 -14 0z" fill={L} />
        <circle cx="170" cy="138" r="7" fill={W} {...line} strokeWidth={2} />
        <path
          d="M163 137 a7 7 0 0 1 14 0 c-4 -3 -10 -3 -14 0z"
          fill={Y}
          {...line}
          strokeWidth={2}
        />
        <circle cx="240" cy="172" r="4" fill={Y} {...line} strokeWidth={2} />
      </g>
      {[110, 206].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="186" r="15" fill={L} />
          <g data-spin>
            <circle cx={cx} cy="186" r="6.5" fill={W} />
            <path d={`M${cx - 6} ${186} H${cx + 6}`} stroke={L} strokeWidth="2" />
          </g>
        </g>
      ))}
      <Person
        x={276}
        y={208}
        s={0.82}
        shirt={Y}
        hair="long"
        arms={[
          armDownL,
          { d: "M13 -76 Q26 -86 26 -106", hand: [26, -108], sway: 14, origin: "0% 100%" },
        ]}
      />
    </Svg>
  );
}

/** Folded map with a drawn route and a pin, and a traveller pointing at it. */
export function MapScene(p: Props) {
  return (
    <Svg {...p}>
      <Ground />
      <path
        d="M44 72 L104 56 L164 72 L224 56 V178 L164 194 L104 178 L44 194 Z"
        fill={W}
        {...line}
      />
      <path d="M104 56 L164 72 V194 L104 178 Z" fill={T} />
      <path d="M104 56 V178 M164 72 V194" {...line} />
      <path d="M44 72 L104 56 L164 72 L224 56 V178 L164 194 L104 178 L44 194 Z" {...line} />
      <path d="M48 150 q16 -14 30 -2 q12 10 22 -4 V178 L48 191 Z" fill={B} opacity="0.85" />
      <circle data-pop cx="70" cy="118" r="5" fill={N} />
      <path
        data-draw
        d="M70 118 C92 92 118 140 140 118 S176 84 196 76"
        stroke={N}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Pin x={196} y={78} />
      <Sparkle x={34} y={52} s={0.8} />
      <Person
        x={270}
        y={208}
        s={0.9}
        arms={[
          { d: "M-13 -76 Q-30 -82 -44 -92", hand: [-46, -93], sway: 6, origin: "100% 100%" },
          armDownR,
        ]}
        back={<rect x="-21" y="-80" width="18" height="34" rx="6" fill={Y} {...line} />}
      />
    </Svg>
  );
}

/** Phone with a ticket on screen, a tick badge and a card; someone taps it. */
export function PhoneScene(p: Props) {
  return (
    <Svg {...p}>
      <Ground />
      <g data-float>
        <rect
          x="30"
          y="112"
          width="62"
          height="40"
          rx="6"
          fill={Y}
          {...line}
          transform="rotate(-12 61 132)"
        />
        <rect
          x="40"
          y="128"
          width="12"
          height="9"
          rx="2"
          fill={W}
          {...line}
          strokeWidth={2}
          transform="rotate(-12 61 132)"
        />
      </g>
      <rect x="112" y="38" width="96" height="170" rx="15" fill={N} {...line} />
      <rect x="120" y="52" width="80" height="140" rx="7" fill={W} {...line} />
      <path d="M150 45 H170" stroke={W} strokeWidth="3" strokeLinecap="round" />
      <rect x="120" y="52" width="80" height="20" rx="7" fill={B} />
      <path d="M120 72 H200" {...line} />
      <rect x="128" y="82" width="64" height="44" rx="5" fill={T} {...line} />
      <path d="M136 94 H170 M136 104 H160 M136 114 H176" {...line} strokeWidth={2} />
      <path d="M128 140 H192 M128 150 H178" {...line} strokeWidth={2} opacity="0.4" />
      <rect data-pop x="132" y="164" width="56" height="18" rx="9" fill={Y} {...line} />
      <g data-pop>
        <circle cx="208" cy="58" r="16" fill={B} {...line} />
        <path
          data-draw
          d="M200 58 l6 6 l10 -12"
          stroke={W}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <Sparkle x={236} y={34} s={0.8} />
      <Sparkle x={98} y={60} s={0.6} c={B} />
      <Person
        x={262}
        y={208}
        s={0.9}
        shirt={Y}
        hair="long"
        arms={[
          { d: "M-13 -76 Q-28 -78 -44 -86", hand: [-46, -87], sway: 5, origin: "100% 50%" },
          armDownR,
        ]}
      />
    </Svg>
  );
}

/** Envelope with a paper plane flying off, someone on the phone. */
export function MailScene(p: Props) {
  return (
    <Svg {...p}>
      <Ground />
      <rect x="40" y="96" width="128" height="84" rx="8" fill={W} {...line} />
      <rect x="58" y="72" width="92" height="60" rx="4" fill={T} {...line} />
      <path d="M72 88 H124 M72 100 H136 M72 112 H112" {...line} strokeWidth={2} />
      <path
        d="M40 104 L104 146 L168 104 V172 a8 8 0 0 1 -8 8 H48 a8 8 0 0 1 -8 -8 Z"
        fill={B}
        {...line}
      />
      <path d="M40 180 L92 138 M168 180 L116 138" {...line} />
      <path
        data-draw
        d="M160 80 C186 52 206 96 232 60"
        stroke={N}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <g data-float>
        <path d="M228 50 L262 40 L246 70 L240 58 Z" fill={W} {...line} />
        <path d="M240 58 L262 40" {...line} />
      </g>
      <g data-pop>
        <rect x="196" y="98" width="46" height="28" rx="14" fill={Y} {...line} />
        <circle data-twinkle cx="209" cy="112" r="2.5" fill={L} />
        <circle data-twinkle cx="219" cy="112" r="2.5" fill={L} />
        <circle data-twinkle cx="229" cy="112" r="2.5" fill={L} />
      </g>
      <Person
        x={276}
        y={208}
        s={0.9}
        arms={[armDownL, { d: "M13 -76 Q26 -92 10 -100", hand: [10, -100] }]}
        front={
          <rect x="8" y="-112" width="9" height="18" rx="3" fill={N} {...line} strokeWidth={2} />
        }
      />
    </Svg>
  );
}

/** Two hikers below a Pyrenees peak with a flag on top. */
export function HikersScene(p: Props) {
  return (
    <Svg {...p}>
      <Ground />
      <g data-float>
        <circle cx="264" cy="50" r="16" fill={Y} {...line} />
      </g>
      <path d="M52 52 q5 -5 10 0 q5 -5 10 0 M86 38 q4 -4 8 0 q4 -4 8 0" {...line} data-float />
      <path d="M14 206 L116 66 L160 120 L196 90 L306 206 Z" fill={T} {...line} />
      <path d="M116 66 L96 94 L108 88 L118 98 L128 86 L138 92 Z" fill={W} {...line} />
      <path d="M196 90 L184 106 L194 102 L202 108 Z" fill={W} {...line} strokeWidth={2} />
      <path d="M116 66 V36" {...line} />
      <g data-sway="8" data-origin="0% 50%">
        <path d="M116 36 L144 43 L116 52 Z" fill={Y} {...line} />
      </g>
      <path
        data-draw
        d="M58 204 C84 184 72 166 98 152 S130 136 140 112"
        stroke={N}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Person
        x={212}
        y={210}
        s={0.82}
        hair="hat"
        shirt={B}
        arms={[
          { d: "M-13 -76 Q-22 -62 -26 -48", hand: [-26, -47] },
          { d: "M13 -76 Q22 -66 24 -54", hand: [24, -52] },
        ]}
        back={<rect x="-24" y="-82" width="20" height="38" rx="7" fill={Y} {...line} />}
        front={<path d="M-26 -47 L-34 0" {...line} />}
      />
      <Person
        x={268}
        y={210}
        s={0.86}
        hair="long"
        shirt={Y}
        pants={B}
        arms={[
          armDownL,
          { d: "M13 -76 Q24 -88 24 -106", hand: [24, -108], sway: 12, origin: "0% 100%" },
        ]}
        back={<rect x="-23" y="-80" width="19" height="36" rx="7" fill={N} {...line} />}
      />
    </Svg>
  );
}

/** A traveller photographs a Sagrada Família-like silhouette with its crane. */
export function SagradaScene(p: Props) {
  const towers: [number, number, number, string][] = [
    [50, 96, 12, T],
    [70, 72, 13, B],
    [92, 56, 14, B],
    [114, 70, 13, T],
    [134, 92, 12, T],
  ];
  return (
    <Svg {...p}>
      <Ground />
      <Cloud x={232} y={52} s={0.9} />
      <path d="M176 206 V48 M162 54 H236 M176 48 L206 54" {...line} />
      <path
        d="M176 70 L190 54 M176 92 L190 70 M176 114 L190 92"
        {...line}
        strokeWidth={2}
        opacity="0.6"
      />
      <g data-sway="6" data-origin="50% 0%">
        <path d="M228 54 V86" {...line} strokeWidth={2} />
        <rect x="222" y="86" width="12" height="9" rx="2" fill={Y} {...line} strokeWidth={2} />
      </g>
      <rect x="36" y="146" width="122" height="60" rx="3" fill={W} {...line} />
      {towers.map(([x, top, w, fill]) => (
        <g key={x}>
          <path
            d={`M${x - w / 2} 150 V${top + 18} Q${x} ${top - 16} ${x + w / 2} ${top + 18} V150 Z`}
            fill={fill}
            {...line}
          />
          <circle cx={x} cy={top - 6} r="3" fill={Y} {...line} strokeWidth={1.8} />
        </g>
      ))}
      <path d="M86 206 V180 a11 11 0 0 1 22 0 V206" fill={N} {...line} />
      <path d="M52 166 V184 M140 166 V184" {...line} strokeWidth={2} />
      <Sparkle x={284} y={104} s={0.8} />
      <Person
        x={262}
        y={210}
        s={0.86}
        shirt={Y}
        arms={[
          { d: "M-13 -76 Q-26 -86 -20 -98", hand: [-19, -99] },
          { d: "M13 -76 Q2 -84 -8 -94", hand: [-8, -95] },
        ]}
        front={
          <g>
            <rect
              x="-30"
              y="-108"
              width="22"
              height="16"
              rx="3"
              fill={N}
              {...line}
              strokeWidth={2}
            />
            <circle cx="-25" cy="-100" r="4" fill={B} {...line} strokeWidth={1.8} />
          </g>
        }
      />
    </Svg>
  );
}

/** An empty, open backpack with travel bits floating around it. */
export function BackpackScene(p: Props) {
  return (
    <Svg {...p}>
      <Ground rx={110} />
      <path d="M144 84 Q160 56 176 84" {...line} strokeWidth={4} />
      <rect x="112" y="80" width="96" height="124" rx="28" fill={B} {...line} />
      <path d="M112 116 Q160 76 208 116 V130 H112 Z" fill={N} {...line} />
      <rect x="152" y="122" width="16" height="14" rx="3" fill={Y} {...line} strokeWidth={2} />
      <rect x="132" y="148" width="56" height="42" rx="12" fill={W} {...line} />
      <path d="M144 162 H176" {...line} strokeWidth={2} />
      <path d="M112 150 h-6 a8 8 0 0 0 -8 8 v26 a8 8 0 0 0 8 8 h6" fill={N} {...line} />
      <g data-float>
        <g transform="rotate(-14 252 92)">
          <path
            d="M222 78 H282 V88 a6 6 0 0 0 0 12 V110 H222 V100 a6 6 0 0 0 0 -12 Z"
            fill={Y}
            {...line}
          />
          <path d="M262 80 V108" {...line} strokeWidth={2} strokeDasharray="3 4" />
        </g>
      </g>
      <Pin x={66} y={112} c={B} />
      <g data-float>
        <circle cx="74" cy="168" r="14" fill={W} {...line} />
        <path d="M74 158 L78 168 L74 178 L70 168 Z" fill={Y} {...line} strokeWidth={1.8} />
      </g>
      <Sparkle x={236} y={156} s={0.8} c={B} />
      <Sparkle x={100} y={52} s={0.7} />
    </Svg>
  );
}

/** Two tickets with a tick and confetti; a traveller jumps for joy. */
export function TicketsScene(p: Props) {
  const ticket = "M0 0 H120 V22 a8 8 0 0 0 0 16 V60 H0 V38 a8 8 0 0 0 0 -16 Z";
  return (
    <Svg {...p}>
      <Ground />
      <g transform="translate(36 74) rotate(-12 60 30)">
        <path d={ticket} fill={Y} {...line} />
        <path d="M88 4 V56" {...line} strokeWidth={2} strokeDasharray="3 5" />
        <path d="M14 18 H66 M14 30 H56 M14 42 H48" {...line} strokeWidth={2} />
      </g>
      <g transform="translate(70 106) rotate(6 60 30)">
        <path d={ticket} fill={B} {...line} />
        <path d="M88 4 V56" {...line} strokeWidth={2} strokeDasharray="3 5" />
        <rect x="14" y="16" width="30" height="18" rx="4" fill={W} {...line} strokeWidth={2} />
        <path d="M14 44 H68" stroke={W} strokeWidth="3" strokeLinecap="round" />
      </g>
      <g data-pop>
        <circle cx="186" cy="102" r="17" fill={N} {...line} />
        <path
          data-draw
          d="M178 102 l6 6 l11 -13"
          stroke={W}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      {[
        [40, 46, Y],
        [118, 40, B],
        [212, 52, N],
        [300, 70, Y],
        [214, 160, B],
      ].map(([x, y, c], i) => (
        <rect
          key={i}
          data-pop
          data-float
          x={x as number}
          y={y as number}
          width="9"
          height="5"
          rx="1.5"
          fill={c as string}
          transform={`rotate(${i * 37} ${x} ${y})`}
        />
      ))}
      <Sparkle x={150} y={56} s={0.7} />
      <g data-bob>
        <Person
          x={264}
          y={202}
          s={0.86}
          hair="long"
          shirt={Y}
          arms={[
            { d: "M-13 -76 Q-26 -92 -30 -110", hand: [-31, -112], sway: -10, origin: "100% 100%" },
            { d: "M13 -76 Q26 -92 30 -110", hand: [31, -112], sway: 10, origin: "0% 100%" },
          ]}
        />
      </g>
    </Svg>
  );
}

/** A bank card with a warning badge; the traveller scratches their head. */
export function CardScene(p: Props) {
  return (
    <Svg {...p}>
      <Ground />
      <g transform="rotate(-8 124 132)">
        <rect x="58" y="90" width="132" height="86" rx="11" fill={B} {...line} />
        <rect x="58" y="108" width="132" height="14" fill={L} />
        <rect x="72" y="134" width="22" height="16" rx="3" fill={Y} {...line} strokeWidth={2} />
        <path d="M72 162 H112 M120 162 H150" stroke={W} strokeWidth="3" strokeLinecap="round" />
      </g>
      <g data-pop>
        <circle data-twinkle cx="190" cy="86" r="17" fill={Y} {...line} />
        <path d="M190 77 V89" {...line} strokeWidth={3.5} />
        <circle cx="190" cy="96" r="2.2" fill={L} />
      </g>
      <g data-float>
        <path d="M232 46 q0 -9 8 -9 q8 0 8 8 q0 6 -8 9 v5" {...line} strokeWidth={3} />
        <circle cx="240" cy="66" r="2.2" fill={L} />
      </g>
      <Person
        x={262}
        y={208}
        s={0.9}
        arms={[
          armDownL,
          { d: "M13 -76 Q30 -96 12 -108", hand: [12, -109], sway: 6, origin: "0% 100%" },
        ]}
      />
    </Svg>
  );
}

/** Calendar page with a highlighted day, a ticking clock and a small plant. */
export function CalendarScene(p: Props) {
  return (
    <Svg {...p}>
      <Ground />
      <rect x="86" y="58" width="146" height="140" rx="12" fill={W} {...line} />
      <path d="M86 92 V70 a12 12 0 0 1 12 -12 H220 a12 12 0 0 1 12 12 V92 Z" fill={B} {...line} />
      <path d="M116 48 V68 M202 48 V68" {...line} strokeWidth={4} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => {
          const x = 102 + c * 30;
          const y = 106 + r * 28;
          const hit = r === 1 && c === 2;
          return hit ? (
            <g key={`${r}${c}`} data-pop>
              <rect x={x} y={y} width="22" height="20" rx="5" fill={Y} {...line} strokeWidth={2} />
              <path d={`M${x + 6} ${y + 10} l4 4 l7 -8`} {...line} strokeWidth={2.2} />
            </g>
          ) : (
            <rect key={`${r}${c}`} x={x} y={y} width="22" height="20" rx="5" fill={T} />
          );
        }),
      )}
      <circle cx="244" cy="170" r="26" fill={W} {...line} />
      <circle cx="244" cy="170" r="3" fill={L} />
      <path d="M244 170 V154" {...line} strokeWidth={3} />
      <g data-spin>
        <path d="M244 170 L258 176" {...line} strokeWidth={2.5} />
      </g>
      <path d="M44 206 L48 176 H76 L80 206 Z" fill={N} {...line} />
      <g data-sway="5" data-origin="50% 100%">
        <path
          d="M62 176 C56 156 46 150 38 146 C48 160 52 168 62 176 Z"
          fill={B}
          {...line}
          strokeWidth={2}
        />
        <path
          d="M62 176 C66 152 76 142 86 138 C80 154 74 166 62 176 Z"
          fill={B}
          {...line}
          strokeWidth={2}
        />
        <path d="M62 176 V150" {...line} strokeWidth={2} />
      </g>
      <Sparkle x={262} y={60} s={0.8} />
    </Svg>
  );
}

/** A lost traveller holding an open map next to a signpost. */
export function LostScene(p: Props) {
  return (
    <Svg {...p}>
      <Ground />
      <Cloud x={84} y={50} s={0.8} />
      <path d="M74 206 V74" {...line} strokeWidth={4} />
      <g data-sway="4" data-origin="0% 50%">
        <path d="M76 84 H124 L134 96 L124 108 H76 Z" fill={B} {...line} />
      </g>
      <g data-sway="-4" data-origin="100% 50%">
        <path d="M72 118 H28 L18 130 L28 142 H72 Z" fill={Y} {...line} />
      </g>
      <Person
        x={196}
        y={208}
        s={0.95}
        shirt={Y}
        arms={[
          { d: "M-13 -76 Q-28 -70 -34 -62", hand: [-35, -61] },
          { d: "M13 -76 Q28 -70 34 -62", hand: [35, -61] },
        ]}
        front={
          <g>
            <path d="M-38 -78 L0 -86 L38 -78 V-38 L0 -46 L-38 -38 Z" fill={W} {...line} />
            <path d="M0 -86 V-46" {...line} strokeWidth={2} />
            <path
              d="M-30 -64 q10 -8 20 2 M8 -60 q10 -10 22 -4"
              stroke={N}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        }
      />
      <g data-float>
        <circle cx="258" cy="66" r="18" fill={B} {...line} />
        <path
          d="M252 60 q0 -7 6 -7 q6 0 6 6 q0 4 -6 6 v4"
          stroke={W}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="258" cy="76" r="2" fill={W} />
      </g>
      <Sparkle x={290} y={110} s={0.6} />
    </Svg>
  );
}

/** A traveller scans the horizon with binoculars; nothing found yet. */
export function SearchScene(p: Props) {
  return (
    <Svg {...p}>
      <Ground />
      <path d="M150 206 Q210 150 306 206 Z" fill={T} />
      <circle
        data-float
        cx="238"
        cy="116"
        r="30"
        stroke={N}
        strokeWidth="2.5"
        strokeDasharray="6 7"
        strokeLinecap="round"
      />
      <Sparkle x={238} y={116} s={0.9} c={W} />
      <Cloud x={262} y={52} s={0.8} />
      <Person
        x={120}
        y={208}
        s={0.95}
        hair="hat"
        arms={[
          { d: "M-13 -76 Q4 -78 12 -92", hand: [12, -93] },
          { d: "M13 -76 Q24 -82 22 -96", hand: [22, -97] },
        ]}
        back={<rect x="-24" y="-82" width="20" height="38" rx="7" fill={Y} {...line} />}
        front={
          <g>
            <rect x="6" y="-104" width="22" height="9" rx="3" fill={N} {...line} strokeWidth={2} />
            <rect x="6" y="-94" width="22" height="9" rx="3" fill={N} {...line} strokeWidth={2} />
            <circle cx="29" cy="-99.5" r="3.4" fill={B} {...line} strokeWidth={1.6} />
            <circle cx="29" cy="-89.5" r="3.4" fill={B} {...line} strokeWidth={1.6} />
          </g>
        }
      />
      <path data-draw d="M156 108 Q186 100 204 110" {...line} strokeWidth={2} />
      <Sparkle x={58} y={70} s={0.7} />
    </Svg>
  );
}

export const SCENES = {
  bus: BusScene,
  map: MapScene,
  phone: PhoneScene,
  mail: MailScene,
  hikers: HikersScene,
  sagrada: SagradaScene,
  backpack: BackpackScene,
  tickets: TicketsScene,
  card: CardScene,
  calendar: CalendarScene,
  lost: LostScene,
  search: SearchScene,
} as const;

export type SceneName = keyof typeof SCENES;
