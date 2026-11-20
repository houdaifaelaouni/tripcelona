/**
 * Tripcelona spot illustrations: original hand-drawn style line art made for
 * this site. Dark navy ink on white, with one blue accent and small "burst"
 * marks, after the doodle references the owner shared (not copies of them).
 * Every path here was written by hand for Tripcelona.
 *
 * All scenes share one 320x240 canvas, so swapping a drawing never changes
 * the space it takes on the page.
 *
 * Animation hooks (read by ./illustration.tsx, all optional):
 *   data-draw     stroke draws itself in when the scene scrolls into view
 *   data-pop      scales in after the drawing
 *   data-float    gentle up/down loop
 *   data-sway     small rotation loop; degrees in the value, origin in data-origin
 *   data-spin     continuous rotation (wheels, clock hand)
 *   data-twinkle  soft fade in and out (burst marks)
 * Every scene is decorative: aria-hidden, no text inside.
 */
import type { ReactNode, SVGProps } from "react";

const L = "var(--color-navy, #04224b)";
const B = "var(--color-cyan, #009fe3)";
const W = "#fff";

const ink = {
  stroke: L,
  strokeWidth: 2.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;
const thin = { ...ink, strokeWidth: 2 } as const;
const blue = { ...ink, stroke: B } as const;

type Props = SVGProps<SVGSVGElement>;

function Svg({ children, ...p }: Props & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 320 240" fill="none" aria-hidden focusable={false} {...p}>
      {children}
    </svg>
  );
}

/* ---------- small marks ---------- */

/** Three short strokes radiating from a point, the "look here" mark. */
function Burst({ x, y, r = 0, s = 1 }: { x: number; y: number; r?: number; s?: number }) {
  return (
    <g data-twinkle transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M-14 -4 L-20 -14 M0 -8 L0 -20 M14 -4 L20 -14" {...ink} />
    </g>
  );
}

function Star({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      data-pop
      d={`M${x} ${y - 9 * s} Q${x + 2 * s} ${y - 2 * s} ${x + 9 * s} ${y} Q${x + 2 * s} ${y + 2 * s} ${x} ${y + 9 * s} Q${x - 2 * s} ${y + 2 * s} ${x - 9 * s} ${y} Q${x - 2 * s} ${y - 2 * s} ${x} ${y - 9 * s}Z`}
      fill={B}
    />
  );
}

function Pin({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g data-float transform={`translate(${x} ${y}) scale(${s})`}>
      <g data-pop>
        <path d="M0 0 c-4 -9 -14 -16 -14 -27 a14 14 0 0 1 28 0 c0 11 -10 18 -14 27z" fill={B} />
        <circle cx="0" cy="-27" r="5" fill={W} />
      </g>
    </g>
  );
}

/* ---------- scenes ---------- */

/** A coach on the road, speed lines behind it. */
export function BusScene(p: Props) {
  return (
    <Svg {...p}>
      <g data-float>
        <circle cx="64" cy="52" r="12" fill={W} {...ink} />
        <path d="M64 30 v-6 M84 38 l5 -4 M44 38 l-5 -4 M88 54 h6 M40 54 h-6" {...thin} />
      </g>
      <path data-draw d="M20 120 h26" {...ink} />
      <path data-draw d="M12 136 h32" {...ink} />
      <path data-draw d="M22 152 h20" {...ink} />
      <g transform="rotate(-3 160 140)">
        <rect x="56" y="88" width="196" height="88" rx="18" fill={W} {...ink} />
        <rect x="70" y="102" width="140" height="34" rx="6" fill={B} />
        <path d="M105 102 v34 M140 102 v34 M175 102 v34" stroke={W} strokeWidth="3" />
        <rect x="220" y="102" width="22" height="42" rx="6" fill={W} {...ink} />
        <path d="M66 152 H246" {...thin} />
        <path d="M70 162 h24 M104 162 h12" {...thin} />
        <circle cx="240" cy="162" r="5" fill={B} />
        {[100, 212].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="178" r="16" fill={W} {...ink} />
            <g data-spin>
              <circle cx={cx} cy="178" r="7" fill={B} />
              <path d={`M${cx - 7} 178 H${cx + 7}`} stroke={W} strokeWidth="2" />
            </g>
          </g>
        ))}
      </g>
      <path data-draw d="M24 204 C90 199 230 207 296 200" {...ink} />
      <Burst x={268} y={84} r={20} />
      <Pin x={282} y={66} s={0.75} />
    </Svg>
  );
}

/** A folded map with a dashed route to a blue pin, and a compass. */
export function MapScene(p: Props) {
  return (
    <Svg {...p}>
      <g transform="rotate(-6 150 128)">
        <path
          d="M54 70 L114 54 L174 70 L234 54 V182 L174 198 L114 182 L54 198 Z"
          fill={W}
          {...ink}
        />
        <path d="M114 54 V182 M174 70 V198" {...ink} />
        <path d="M54 156 q16 -12 30 -2 q14 8 30 -4 V182 L54 198 Z" fill={B} />
        <path d="M54 70 L114 54 L174 70 L234 54 V182 L174 198 L114 182 L54 198 Z" {...ink} />
        <path d="M188 150 l10 10 m0 -10 l-10 10" {...thin} />
        <circle cx="76" cy="116" r="5" fill={W} {...ink} />
        <path
          d="M80 112 C102 92 124 140 146 116 S184 86 202 92"
          stroke={B}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="2 8"
        />
      </g>
      <Pin x={204} y={96} />
      <Burst x={206} y={50} r={8} s={0.8} />
      <g transform="translate(266 178)">
        <circle r="22" fill={W} {...ink} />
        <circle r="16" {...thin} />
        <g data-sway="14" data-origin="50% 50%">
          <path d="M0 -12 L4 0 L0 12 L-4 0 Z" fill={B} />
        </g>
      </g>
    </Svg>
  );
}

/** A phone showing a trip booking, a ticket sliding out behind it. */
export function PhoneScene(p: Props) {
  const ticket = "M0 0 H116 V22 a9 9 0 0 0 0 18 V62 H0 V40 a9 9 0 0 0 0 -18 Z";
  return (
    <Svg {...p}>
      <g data-float transform="translate(172 54) rotate(14)">
        <path d={ticket} fill={B} {...ink} />
        <path d="M84 6 V56" stroke={W} strokeWidth="2.4" strokeDasharray="3 5" />
        <path
          d="M14 18 h48 M14 30 h36 M14 42 h44"
          stroke={W}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      <g transform="rotate(-10 140 124)">
        <rect x="88" y="30" width="104" height="184" rx="18" fill={W} {...ink} />
        <path d="M86 70 v18" {...ink} strokeWidth={4} />
        <rect x="98" y="46" width="84" height="152" rx="9" fill={W} {...ink} />
        <path d="M98 55 a9 9 0 0 1 9 -9 h66 a9 9 0 0 1 9 9 v31 q-42 12 -84 0 z" fill={B} />
        <rect x="124" y="58" width="32" height="16" rx="4" stroke={W} strokeWidth="2.4" />
        <path d="M124 66 h32" stroke={W} strokeWidth="2" />
        <circle cx="131" cy="76" r="2.4" fill={W} />
        <circle cx="149" cy="76" r="2.4" fill={W} />
        <circle cx="112" cy="108" r="7" {...blue} strokeWidth={2.2} />
        <path d="M112 104 v4 l3 2" {...blue} strokeWidth={2} />
        <path d="M126 104 h40 M126 112 h26" {...blue} />
        <path
          d="M112 142 c-2 -4 -7 -7 -7 -12 a7 7 0 0 1 14 0 c0 5 -5 8 -7 12z"
          {...blue}
          strokeWidth={2.2}
        />
        <path d="M126 130 h36 M126 138 h22" {...blue} />
        <path d="M117 154 a6 7 0 1 0 0 10 M105 157 h9 M105 161 h9" {...blue} strokeWidth={2.2} />
        <path d="M126 156 h30 M126 164 h18" {...blue} />
        <g data-pop>
          <rect x="112" y="176" width="58" height="16" rx="8" fill={W} {...blue} />
          <path d="M132 184 h16 m-5 -4 l5 4 l-5 4" {...blue} strokeWidth={2.2} />
        </g>
      </g>
      <Burst x={206} y={40} r={24} />
    </Svg>
  );
}

/** An open envelope with a ticked letter and a paper plane taking off. */
export function MailScene(p: Props) {
  return (
    <Svg {...p}>
      <g transform="rotate(-5 120 140)">
        <rect x="52" y="100" width="136" height="92" rx="8" fill={W} {...ink} />
        <rect x="70" y="64" width="100" height="84" rx="5" fill={W} {...ink} />
        <path d="M84 84 h46 M84 96 h64 M84 108 h36" {...thin} />
        <g data-pop>
          <circle cx="154" cy="82" r="11" fill={B} />
          <path
            data-draw
            d="M149 82 l4 4 l7 -8"
            stroke={W}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <path
          d="M52 108 L120 152 L188 108 V184 a8 8 0 0 1 -8 8 H60 a8 8 0 0 1 -8 -8 Z"
          fill={W}
          {...ink}
        />
        <path d="M52 190 L104 146 M188 190 L136 146" {...ink} />
      </g>
      <path d="M196 98 C214 74 200 60 222 70" {...thin} strokeDasharray="3 6" />
      <g data-float>
        <path d="M226 68 L288 46 L260 102 L250 78 Z" fill={W} {...ink} />
        <path d="M250 78 L256 96 L288 46 Z" fill={B} />
        <path d="M250 78 L288 46" {...ink} />
      </g>
      <Burst x={286} y={36} r={30} s={0.8} />
      <Star x={46} y={70} s={0.8} />
    </Svg>
  );
}

/** Pyrenees peaks with a flag on top, a dashed trail and two pines. */
export function HikersScene(p: Props) {
  return (
    <Svg {...p}>
      <g data-float>
        <circle cx="258" cy="50" r="13" fill={W} {...ink} />
        <path d="M258 28 v-6 M278 36 l5 -4 M238 36 l-5 -4 M282 52 h6 M234 52 h-6" {...thin} />
      </g>
      <path d="M44 66 q5 -5 10 0 q5 -5 10 0 M78 52 q4 -4 8 0 q4 -4 8 0" {...thin} />
      <path d="M24 196 L112 64 L150 118 L186 84 L296 196 Z" fill={W} {...ink} />
      <path d="M112 64 L97 87 L107 83 L115 93 L124 81 L132 87 Z" fill={B} {...ink} />
      <path d="M186 84 L176 98 L184 95 L192 101 L198 95 Z" fill={B} {...ink} />
      <path d="M112 64 V30" {...ink} />
      <g data-sway="8" data-origin="0% 50%">
        <path d="M112 30 Q126 26 138 34 Q126 40 112 42 Z" fill={B} {...ink} />
      </g>
      <path data-draw d="M70 194 C90 172 84 156 104 142 S130 126 140 112" {...thin} />
      <g transform="translate(244 196)">
        <path d="M0 0 V-10" {...ink} />
        <path d="M-14 -10 L0 -42 L14 -10 Z" fill={W} {...ink} />
      </g>
      <g transform="translate(268 196)">
        <path d="M0 0 V-8" {...ink} />
        <path d="M-11 -8 L0 -32 L11 -8 Z" fill={B} {...ink} />
      </g>
      <path data-draw d="M14 196 H306" {...ink} />
      <Burst x={112} y={18} s={0.7} />
    </Svg>
  );
}

/** Sagrada Família-like towers with a crane, a camera in front. */
export function SagradaScene(p: Props) {
  const towers: [number, number, number, boolean][] = [
    [54, 92, 12, false],
    [74, 70, 13, true],
    [96, 52, 14, true],
    [118, 68, 13, false],
    [138, 90, 12, false],
  ];
  return (
    <Svg {...p}>
      <path d="M190 198 V40 M174 46 H262 M190 40 L218 46" {...ink} />
      <path d="M190 64 l14 -16 M190 88 l14 -22 M190 112 l14 -22" {...thin} />
      <g data-sway="6" data-origin="50% 0%">
        <path d="M250 46 V78" {...thin} />
        <rect x="243" y="78" width="14" height="10" rx="2" fill={B} />
      </g>
      <rect x="40" y="140" width="124" height="58" rx="3" fill={W} {...ink} />
      {towers.map(([x, top, w, isBlue]) => (
        <g key={x}>
          <path
            d={`M${x - w / 2} 144 V${top + 18} Q${x} ${top - 16} ${x + w / 2} ${top + 18} V144 Z`}
            fill={isBlue ? B : W}
            {...ink}
          />
          <circle cx={x} cy={top - 6} r="3" fill={W} {...thin} />
          {!isBlue && <path d={`M${x} ${top + 30} v10`} {...thin} />}
        </g>
      ))}
      <path d="M90 198 V176 a12 12 0 0 1 24 0 V198" fill={B} {...ink} />
      <path d="M56 160 v18 M148 160 v18" {...thin} />
      <path data-draw d="M18 198 H200" {...ink} />
      <g transform="rotate(-10 250 172)">
        <path d="M228 146 v-8 h20 v8" fill={W} {...ink} />
        <rect x="212" y="146" width="76" height="50" rx="9" fill={W} {...ink} />
        <circle cx="250" cy="171" r="16" fill={W} {...ink} />
        <circle cx="250" cy="171" r="8" fill={B} />
        <rect x="270" y="152" width="10" height="7" rx="2" fill={B} />
      </g>
      <Burst x={292} y={130} r={30} s={0.85} />
    </Svg>
  );
}

/** An empty, closed backpack with travel bits floating around it. */
export function BackpackScene(p: Props) {
  const ticket = "M0 0 H58 V11 a6 6 0 0 0 0 12 V34 H0 V23 a6 6 0 0 0 0 -12 Z";
  return (
    <Svg {...p}>
      <g transform="rotate(4 160 140)">
        <path d="M144 70 q16 -26 32 0" {...ink} strokeWidth={3.2} />
        <path d="M104 132 h-10 a8 8 0 0 0 -8 8 v34 a8 8 0 0 0 8 8 h10" fill={W} {...ink} />
        <rect x="104" y="66" width="112" height="136" rx="34" fill={W} {...ink} />
        <path d="M104 106 Q160 66 216 106 V120 H104 Z" fill={B} {...ink} />
        <rect x="152" y="112" width="16" height="14" rx="3" fill={W} {...ink} />
        <rect x="124" y="142" width="72" height="46" rx="12" fill={W} {...ink} />
        <rect
          x="131"
          y="149"
          width="58"
          height="32"
          rx="7"
          {...thin}
          strokeWidth={1.6}
          strokeDasharray="3 5"
        />
      </g>
      <g data-float transform="translate(232 72) rotate(-16)">
        <path d={ticket} fill={B} {...ink} />
        <path d="M42 4 V30" stroke={W} strokeWidth="2" strokeDasharray="2 4" />
      </g>
      <g data-float>
        <circle cx="62" cy="86" r="11" fill={B} {...ink} />
        <circle cx="92" cy="86" r="11" fill={B} {...ink} />
        <path d="M73 84 q4 -4 8 0 M51 84 l-8 -6 M103 84 l8 -6" {...ink} />
      </g>
      <Pin x={66} y={170} s={0.8} />
      <Star x={256} y={164} />
      <Burst x={160} y={34} s={0.8} />
    </Svg>
  );
}

/** Two tickets, a big blue tick and a little confetti. */
export function TicketsScene(p: Props) {
  const ticket = "M0 0 H128 V24 a9 9 0 0 0 0 18 V66 H0 V42 a9 9 0 0 0 0 -18 Z";
  return (
    <Svg {...p}>
      <g transform="translate(34 66) rotate(-12 64 33)">
        <path d={ticket} fill={W} {...ink} />
        <path d="M94 6 V60" {...thin} strokeDasharray="3 5" />
        <path d="M14 18 h56 M14 31 h44 M14 44 h50" {...thin} />
      </g>
      <g transform="translate(78 108) rotate(6 64 33)">
        <path d={ticket} fill={B} {...ink} />
        <path d="M94 6 V60" stroke={W} strokeWidth="2.4" strokeDasharray="3 5" />
        <path
          d="M14 18 v24 M20 18 v24 M24 18 v24 M31 18 v24 M35 18 v24 M42 18 v24"
          stroke={W}
          strokeWidth="2.4"
        />
        <path d="M54 22 h26 M54 34 h18" stroke={W} strokeWidth="3" strokeLinecap="round" />
      </g>
      <g data-pop>
        <circle cx="240" cy="92" r="26" fill={B} />
        <path
          data-draw
          d="M228 92 l9 9 l16 -18"
          stroke={W}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <Burst x={240} y={56} s={0.9} />
      <path data-pop d="M252 154 q6 -8 12 0 t12 0" {...blue} strokeWidth={3} />
      <path data-pop d="M42 44 l8 8 m0 -8 l-8 8" {...thin} />
      <circle data-pop cx="290" cy="122" r="4" {...ink} />
      <Star x={186} y={48} s={0.8} />
      <Star x={274} y={196} s={0.6} />
    </Svg>
  );
}

/** A bank card in front of a receipt, with a blue warning sign. */
export function CardScene(p: Props) {
  return (
    <Svg {...p}>
      <g transform="rotate(8 196 110)">
        <path
          d="M150 40 H244 V176 l-8 -6 l-8 6 l-8 -6 l-8 6 l-8 -6 l-8 6 l-8 -6 l-8 6 l-8 -6 l-8 6 l-8 -6 Z"
          fill={W}
          {...ink}
        />
        <path d="M164 62 h46 M164 76 h66 M164 90 h56 M164 104 h66" {...thin} />
      </g>
      <g transform="rotate(-10 126 148)">
        <rect x="50" y="102" width="152" height="94" rx="12" fill={W} {...ink} />
        <rect x="66" y="122" width="26" height="20" rx="4" fill={B} />
        <path d="M108 122 a10 10 0 0 1 0 20 M114 116 a17 17 0 0 1 0 32" {...thin} />
        {[66, 98, 130, 162].map((x) => (
          <g key={x}>
            {[0, 6, 12, 18].map((d) => (
              <circle key={d} cx={x + d} cy="166" r="1.8" fill={L} />
            ))}
          </g>
        ))}
        <path d="M66 182 h40" {...thin} />
      </g>
      <g data-pop>
        <circle cx="214" cy="156" r="21" fill={B} />
        <path d="M214 144 V159" stroke={W} strokeWidth="4" strokeLinecap="round" />
        <circle cx="214" cy="168" r="2.6" fill={W} />
      </g>
      <Burst x={246} y={136} r={40} s={0.8} />
    </Svg>
  );
}

/** A calendar page with one circled day and a ticking clock. */
export function CalendarScene(p: Props) {
  return (
    <Svg {...p}>
      <g transform="rotate(-4 146 126)">
        <rect x="70" y="56" width="150" height="140" rx="12" fill={W} {...ink} />
        <path d="M70 92 V68 a12 12 0 0 1 12 -12 H208 a12 12 0 0 1 12 12 V92 Z" fill={B} {...ink} />
        <rect x="98" y="44" width="9" height="22" rx="4.5" fill={W} {...ink} />
        <rect x="183" y="44" width="9" height="22" rx="4.5" fill={W} {...ink} />
        {[0, 1, 2].map((r) =>
          [0, 1, 2, 3].map((c) => {
            const x = 88 + c * 31;
            const y = 106 + r * 28;
            const hit = r === 1 && c === 2;
            return (
              <rect
                key={`${r}${c}`}
                x={x}
                y={y}
                width="20"
                height="17"
                rx="4"
                fill={hit ? B : W}
                {...thin}
                strokeWidth={1.8}
              />
            );
          }),
        )}
        <path
          data-draw
          d="M146 132 C152 126 172 126 177 136 C182 146 172 156 158 156 C144 156 140 146 144 138 C146 133 152 131 156 131"
          {...blue}
          strokeWidth={2.8}
        />
      </g>
      <g transform="translate(240 172)">
        <circle r="30" fill={W} {...ink} />
        <path d="M0 -24 v5 M24 0 h-5 M0 24 v-5 M-24 0 h5" {...thin} />
        <path d="M0 0 V-14" {...ink} strokeWidth={3} />
        <g data-spin>
          <path d="M0 0 L14 6" stroke={B} strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle r="3" fill={L} />
      </g>
      <Burst x={240} y={128} s={0.8} />
    </Svg>
  );
}

/** A signpost pointing every way and a big blue question mark. */
export function LostScene(p: Props) {
  return (
    <Svg {...p}>
      <path d="M120 200 V56" {...ink} strokeWidth={3.4} />
      <g data-sway="3" data-origin="0% 50%">
        <path d="M122 70 H198 L212 84 L198 98 H122 Z" fill={B} {...ink} />
      </g>
      <g data-sway="-3" data-origin="100% 50%">
        <path d="M118 110 H52 L38 124 L52 138 H118 Z" fill={W} {...ink} />
        <path d="M60 124 h40" {...thin} />
      </g>
      <path d="M122 150 H180 L190 160 L180 170 H122 Z" fill={W} {...ink} />
      <path d="M96 202 q24 -14 48 0" {...ink} />
      <path d="M150 210 C200 198 240 212 296 202" {...thin} strokeDasharray="3 7" />
      <g data-float>
        <path d="M238 78 q0 -20 18 -20 q18 0 18 17 q0 12 -16 19 v12" {...blue} strokeWidth={6} />
        <circle cx="258" cy="124" r="4.5" fill={B} />
      </g>
      <Burst x={256} y={44} s={0.85} />
      <Star x={52} y={70} s={0.8} />
    </Svg>
  );
}

/** A big magnifying glass over a dashed trail: nothing found yet. */
export function SearchScene(p: Props) {
  return (
    <Svg {...p}>
      <path d="M26 196 C70 170 96 196 120 150" {...thin} strokeDasharray="3 7" />
      <path d="M262 52 l12 12 m0 -12 l-12 12" {...ink} />
      <g data-sway="5" data-origin="30% 30%">
        <path d="M184 146 L230 192" stroke={L} strokeWidth="18" strokeLinecap="round" />
        <path d="M184 146 L230 192" stroke={W} strokeWidth="12" strokeLinecap="round" />
        <path d="M208 170 L230 192" stroke={B} strokeWidth="12" strokeLinecap="round" />
        <circle cx="150" cy="112" r="50" fill={W} {...ink} strokeWidth={3} />
        <circle cx="150" cy="112" r="40" {...thin} />
        <path d="M120 96 a32 32 0 0 1 22 -18" {...blue} strokeWidth={4} />
        <path d="M150 132 c-3 -6 -10 -11 -10 -18 a10 10 0 0 1 20 0 c0 7 -7 12 -10 18z" {...blue} />
        <circle cx="150" cy="114" r="3.4" fill={B} />
      </g>
      <Burst x={150} y={50} s={0.85} />
      <Star x={264} y={130} s={0.8} />
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
