export function FlameMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="silverFlame" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#9a9aa2" />
        </linearGradient>
      </defs>
      <path
        d="M17.5 2.2c.7 4.2-1.4 6.6-3.5 8.9-2.2 2.4-4.5 4.8-4.5 9 0 5 4 8.7 8.9 8.7 5.3 0 9.1-3.9 9.1-9.2 0-3.4-1.6-6.2-3.2-8.1-.5 1.6-1.6 2.6-2.9 3-.2-4.9-2.2-9-3.9-12.3Z"
        fill="url(#silverFlame)"
      />
      <path
        d="M16.3 17c.4 2 .2 3.1-.6 4.2-.8 1.1-1.5 2-1.5 3.4 0 1.9 1.5 3.3 3.4 3.3 2 0 3.5-1.5 3.5-3.5 0-1.6-.9-2.9-1.7-3.9-.4.6-.9.9-1.5 1-.1-1.9-.6-3.4-1.1-4.5Z"
        fill="#0b0b0d"
        fillOpacity="0.9"
      />
    </svg>
  );
}

export function Logo({ size = 24 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <FlameMark size={size} />
      <span
        className="font-display font-bold tracking-tight text-bone"
        style={{ fontSize: size * 0.92 }}
      >
        Burnt
      </span>
    </span>
  );
}
