import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#0d0b1e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" style={{ display: 'flex' }}>
          <defs>
            <linearGradient id="g" x1="20%" y1="0%" x2="75%" y2="100%">
              <stop offset="0%"   stopColor="#ede9fe" />
              <stop offset="38%"  stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>
          </defs>
          <path
            d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z"
            fill="url(#g)"
          />
          <path
            d="M12 12 L14.5 9.5 L22 12 L14.5 14.5 Z"
            fill="rgba(4,2,18,0.52)"
          />
        </svg>
      </div>
    ),
    { width: 32, height: 32 }
  )
}
