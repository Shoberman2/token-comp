export function TokenMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="tokenRim" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#84848d" />
        </linearGradient>
        <linearGradient id="tokenSpark" x1="32" y1="15" x2="32" y2="49" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#9a9aa2" />
        </linearGradient>
      </defs>
      {/* coin face */}
      <circle cx="32" cy="32" r="26" fill="var(--color-panel, #141419)" stroke="url(#tokenRim)" strokeWidth="3" />
      {/* rim ticks, like a minted token */}
      <circle
        cx="32"
        cy="32"
        r="21.5"
        fill="none"
        stroke="url(#tokenRim)"
        strokeOpacity="0.45"
        strokeWidth="1.6"
        strokeDasharray="2.6 14.28"
        strokeDashoffset="1.3"
      />
      {/* AI sparkle */}
      <path
        d="M32 16.5c1.9 9.2 5.6 12.9 14.5 15.5-8.9 2.6-12.6 6.3-14.5 15.5-1.9-9.2-5.6-12.9-14.5-15.5 8.9-2.6 12.6-6.3 14.5-15.5Z"
        fill="url(#tokenSpark)"
      />
    </svg>
  );
}

export function Logo({ size = 24 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <TokenMark size={size} />
      <span
        className="font-display font-bold tracking-tight text-bone"
        style={{ fontSize: size * 0.92 }}
      >
        Burnt
      </span>
    </span>
  );
}
