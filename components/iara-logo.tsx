interface IaraLogoProps {
  size?: 'sm' | 'md' | 'lg'
  layout?: 'horizontal' | 'vertical'
  className?: string
}

const ICON = {
  sm: { wrap: 32, svg: 17 },
  md: { wrap: 52, svg: 28 },
  lg: { wrap: 64, svg: 34 },
}

const TEXT = {
  sm: { iara: 'text-[15px]', hub: 'text-[9px]', lineW: 7 },
  md: { iara: 'text-[22px]', hub: 'text-[10px]', lineW: 13 },
  lg: { iara: 'text-[28px]', hub: 'text-xs',     lineW: 18 },
}

export function IaraLogo({ size = 'sm', layout = 'horizontal', className = '' }: IaraLogoProps) {
  const icon = ICON[size]
  const text = TEXT[size]
  const showSparkle = size !== 'sm'

  return (
    <div
      className={`flex ${layout === 'vertical' ? 'flex-col items-center gap-3' : 'items-center gap-2.5'} ${className}`}
    >
      {/* ── Icon ── */}
      <div
        className="relative flex-shrink-0 flex items-center justify-center rounded-full"
        style={{ width: icon.wrap, height: icon.wrap }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 rounded-full blur-md"
          style={{ background: 'rgba(139,92,246,0.22)' }}
        />
        {/* Ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: '#0d0d20',
            border: '1px solid rgba(139,92,246,0.35)',
          }}
        />

        {/* Star */}
        <svg
          width={icon.svg}
          height={icon.svg}
          viewBox="0 0 24 24"
          fill="none"
          className="relative z-10"
        >
          <defs>
            <linearGradient id="iara-star-grad" x1="40%" y1="0%" x2="60%" y2="100%">
              <stop offset="0%"   stopColor="#ddd6fe" />
              <stop offset="45%"  stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          <path
            d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z"
            fill="url(#iara-star-grad)"
          />
        </svg>

        {/* Small sparkle top-right */}
        {showSparkle && (
          <svg
            width={size === 'md' ? 7 : 9}
            height={size === 'md' ? 7 : 9}
            viewBox="0 0 24 24"
            fill="none"
            className="absolute z-10"
            style={{ top: size === 'md' ? 3 : 4, right: size === 'md' ? 3 : 4 }}
          >
            <path
              d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z"
              fill="#c4b5fd"
              opacity="0.9"
            />
          </svg>
        )}
      </div>

      {/* ── Wordmark ── */}
      <div
        className={`flex flex-col leading-none gap-[5px] ${layout === 'vertical' ? 'items-center' : 'items-start'}`}
      >
        <span
          className={`font-bold text-white ${text.iara}`}
          style={{ letterSpacing: '0.28em' }}
        >
          IARA
        </span>
        <div
          className={`flex items-center gap-1.5 font-semibold text-[#7a7a9a] ${text.hub}`}
          style={{ letterSpacing: '0.22em' }}
        >
          <span
            style={{
              display: 'block',
              width: text.lineW,
              height: 1,
              background: 'rgba(120,80,200,0.5)',
              borderRadius: 1,
            }}
          />
          HUB
          <span
            style={{
              display: 'block',
              width: text.lineW,
              height: 1,
              background: 'rgba(120,80,200,0.5)',
              borderRadius: 1,
            }}
          />
        </div>
      </div>
    </div>
  )
}
