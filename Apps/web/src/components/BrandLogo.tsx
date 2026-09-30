type Props = {
  size?: number;
};

export function BrandLogo({ size = 36 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className="brand-logo"
    >
      <defs>
        <linearGradient id="brand-logo-bg" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#brand-logo-bg)" />
      <rect x="9" y="11" width="22" height="19" rx="4" stroke="#fff" strokeWidth="2.2" />
      <path d="M9 17h22" stroke="#fff" strokeWidth="2.2" />
      <path d="M15 8v5M25 8v5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="m15.5 23.5 3 3 6-6"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
