// Stylized gold "Sprinters" crest. Swap for the client's real logo asset later
// (drop a PNG/SVG in /public and replace this component's innards).

export function Logo({ size = 120 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center select-none" style={{ width: size }}>
      <svg viewBox="0 0 120 70" width={size} height={size * 0.58} aria-hidden>
        <defs>
          <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6e2a0" />
            <stop offset="0.5" stopColor="#e7c15b" />
            <stop offset="1" stopColor="#b8860b" />
          </linearGradient>
        </defs>
        <g fill="url(#gold)">
          {/* crown flourish */}
          <path d="M60 6l6 10 10-8-3 14h-26l-3-14 10 8z" />
          <circle cx="60" cy="4" r="3" />
          <rect x="37" y="23" width="46" height="2.4" rx="1.2" />
        </g>
        <text
          x="60"
          y="48"
          textAnchor="middle"
          fontSize="20"
          fontWeight="800"
          letterSpacing="2"
          fill="url(#gold)"
          fontFamily="Georgia, 'Times New Roman', serif"
        >
          SPRINTERS
        </text>
        <text
          x="60"
          y="62"
          textAnchor="middle"
          fontSize="6.5"
          letterSpacing="3"
          fill="#d9c58a"
          fontFamily="ui-sans-serif, system-ui"
        >
          KING OF ONLINE GAMING
        </text>
      </svg>
    </div>
  );
}

export function LogoBadge({ size = 40 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full bg-black/40 ring-1 ring-[var(--brand-gold)]/40"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} aria-hidden>
        <defs>
          <linearGradient id="goldb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6e2a0" />
            <stop offset="1" stopColor="#c99a2e" />
          </linearGradient>
        </defs>
        <path
          d="M12 2l2.2 3.6L18 3l-1.1 5H7.1L6 3l3.8 2.6z"
          fill="url(#goldb)"
        />
        <text x="12" y="20" textAnchor="middle" fontSize="9" fontWeight="800" fill="url(#goldb)" fontFamily="Georgia, serif">S</text>
      </svg>
    </div>
  );
}
