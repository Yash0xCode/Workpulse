function Logo({ size = 36, variant = 'full' }) {
  const isCompact = variant === 'icon'

  return (
    <div className="wp-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="pulseGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2A4DFF" />
            <stop offset="100%" stopColor="#00C9FF" />
          </linearGradient>
        </defs>
        <rect x="6" y="6" width="52" height="52" rx="18" fill="url(#pulseGradient)" />
        <path
          d="M18 36h10l5-12 6 18 5-10h10"
          stroke="#fff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="46" cy="26" r="4" fill="#fff" opacity="0.9" />
      </svg>
      {!isCompact && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>WorkPulse</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--wp-text-muted)' }}>
            Workforce Intelligence
          </span>
        </div>
      )}
    </div>
  )
}

export default Logo
