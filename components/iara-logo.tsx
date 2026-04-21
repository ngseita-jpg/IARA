interface IaraLogoProps {
  size?: 'sm' | 'md' | 'lg'
  layout?: 'horizontal' | 'vertical'
  className?: string
}

const ICON = {
  sm: { size: 28, svg: 18 },
  md: { size: 44, svg: 28 },
  lg: { size: 56, svg: 36 },
}

const TEXT = {
  sm: { iara: 'text-[15px]', hub: 'text-[8.5px]' },
  md: { iara: 'text-[22px]', hub: 'text-[11px]' },
  lg: { iara: 'text-[28px]', hub: 'text-[13px]' },
}

export function IaraStar({ size = 32, id = 'iara-star' }: { size?: number; id?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={`${id}-grad`} x1="20%" y1="0%" x2="75%" y2="100%">
          <stop offset="0%"   stopColor="#ede9fe" />
          <stop offset="38%"  stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      {/* Main star */}
      <path
        d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z"
        fill={`url(#${id}-grad)`}
      />
      {/* Depth shadow — right quadrant */}
      <path
        d="M12 12 L14.5 9.5 L22 12 L14.5 14.5 Z"
        fill="rgba(4,2,18,0.52)"
      />
    </svg>
  )
}

export function IaraLogo({ size = 'sm', layout = 'horizontal', className = '' }: IaraLogoProps) {
  const icon = ICON[size]
  const text = TEXT[size]

  return (
    <div
      className={`flex ${layout === 'vertical' ? 'flex-col items-center gap-3' : 'items-center gap-2.5'} ${className}`}
    >
      {/* Icon */}
      <div
        className="relative flex-shrink-0 flex items-center justify-center"
        style={{ width: icon.size, height: icon.size }}
      >
        <div
          className="absolute inset-0 rounded-full blur-lg"
          style={{ background: 'rgba(139,92,246,0.18)' }}
        />
        <IaraStar size={icon.svg} id={`logo-${size}`} />
      </div>

      {/* Wordmark */}
      <div
        className={`flex flex-col leading-none gap-[4px] ${layout === 'vertical' ? 'items-center' : 'items-start'}`}
      >
        <span
          className={`font-bold text-white ${text.iara}`}
          style={{ letterSpacing: '0.30em' }}
        >
          IARA
        </span>
        <span
          className={`font-medium text-white/70 ${text.hub}`}
          style={{ letterSpacing: '0.28em' }}
        >
          HUB
        </span>
      </div>
    </div>
  )
}
