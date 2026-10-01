type Props = {
  size?: number;
  /** Accessible name for the mark (default: meeting-room booking). */
  label?: string;
};

export function BrandLogo({
  size = 36,
  label = "Meeting room booking",
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label={label}
      className="brand-logo"
    >
      <defs>
        <linearGradient id="brand-logo-bg" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#brand-logo-bg)" />
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fill="#fff"
        fontFamily="system-ui, -apple-system, Segoe UI, sans-serif"
        fontSize="18"
        fontWeight="700"
        letterSpacing="-0.5"
      >
        MR
      </text>
    </svg>
  );
}
