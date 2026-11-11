/*
 * Original inline SVG illustrations for the public site (no external
 * assets). Decorative only, so they are hidden from assistive tech.
 */

/** Layered mountain ridges with clouds for the bottom of the hero. */
export function HeroMountains({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 320"
      preserveAspectRatio="xMidYMax slice"
      className={className}
    >
      <g data-float fill="#ffffff" opacity="0.18">
        <ellipse cx="220" cy="70" rx="70" ry="16" />
        <ellipse cx="270" cy="58" rx="46" ry="14" />
      </g>
      <g data-float fill="#ffffff" opacity="0.14">
        <ellipse cx="1130" cy="96" rx="80" ry="16" />
        <ellipse cx="1180" cy="84" rx="50" ry="14" />
      </g>
      <path
        fill="#1a82cc"
        opacity="0.35"
        d="M0 220 L140 120 L230 180 L360 70 L470 170 L600 90 L720 190 L860 80 L990 170 L1110 100 L1250 190 L1440 110 L1440 320 L0 320 Z"
      />
      <path
        fill="#005999"
        opacity="0.55"
        d="M0 260 L120 190 L250 240 L390 150 L520 230 L660 160 L800 240 L930 170 L1070 240 L1210 170 L1340 230 L1440 190 L1440 320 L0 320 Z"
      />
      <path
        fill="#00224f"
        d="M0 300 L160 250 L320 290 L480 240 L640 290 L820 250 L980 295 L1150 255 L1300 290 L1440 260 L1440 320 L0 320 Z"
      />
    </svg>
  );
}

/** A coach on a winding road, for the groups block. */
export function CoachIllustration({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 320 200" className={className}>
      <circle cx="250" cy="50" r="26" fill="#feba02" opacity="0.9" />
      <path
        d="M0 150 L70 90 L120 130 L190 70 L260 130 L320 100 L320 200 L0 200 Z"
        fill="#ffffff"
        opacity="0.08"
      />
      <path
        d="M-10 185 C60 160 120 190 180 170 S290 150 330 165"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.25"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <g data-float>
        <rect x="96" y="112" width="124" height="52" rx="12" fill="#ffffff" />
        <rect x="96" y="148" width="124" height="16" rx="6" fill="#feba02" />
        <g fill="#80b5e3">
          <rect x="106" y="120" width="22" height="20" rx="4" />
          <rect x="134" y="120" width="22" height="20" rx="4" />
          <rect x="162" y="120" width="22" height="20" rx="4" />
          <rect x="190" y="120" width="22" height="24" rx="4" />
        </g>
        <circle cx="124" cy="166" r="10" fill="#00224f" />
        <circle cx="124" cy="166" r="4" fill="#ffffff" />
        <circle cx="192" cy="166" r="10" fill="#00224f" />
        <circle cx="192" cy="166" r="4" fill="#ffffff" />
      </g>
    </svg>
  );
}
