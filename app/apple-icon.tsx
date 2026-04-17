import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 100,
          fontWeight: 900,
          fontFamily: 'sans-serif',
          letterSpacing: '-4px',
        }}
      >
        I
      </div>
    ),
    { width: 180, height: 180 }
  )
}
