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
          borderRadius: '50%',
          background: '#0d0d20',
          border: '1px solid rgba(139,92,246,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* 4-pointed star */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          style={{ display: 'flex' }}
        >
          <defs>
            <linearGradient id="g" x1="40%" y1="0%" x2="60%" y2="100%">
              <stop offset="0%"   stopColor="#ddd6fe" />
              <stop offset="45%"  stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          <path
            d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z"
            fill="url(#g)"
          />
        </svg>
      </div>
    ),
    { width: 32, height: 32 }
  )
}
