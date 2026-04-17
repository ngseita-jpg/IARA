import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Iara — Assessoria com IA para Criadores'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0a0a14',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow blobs */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 800,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '20%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(168,85,247,0.10) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '30%',
            right: '20%',
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(236,72,153,0.08) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 40px rgba(99,102,241,0.4)',
            }}
          >
            <div style={{ color: 'white', fontSize: 28, fontWeight: 900 }}>✦</div>
          </div>
          <span
            style={{
              fontSize: 52,
              fontWeight: 900,
              background: 'linear-gradient(90deg, #818cf8, #c084fc, #f472b6)',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-2px',
            }}
          >
            Iara
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: '#f1f1f8',
            textAlign: 'center',
            lineHeight: 1.15,
            maxWidth: 900,
            letterSpacing: '-1px',
            marginBottom: 20,
          }}
        >
          Sua assessora de comunicação{' '}
          <span
            style={{
              background: 'linear-gradient(90deg, #818cf8, #c084fc)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            com IA
          </span>
        </div>

        {/* Sub */}
        <div
          style={{
            fontSize: 24,
            color: '#9b9bb5',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.5,
            marginBottom: 44,
          }}
        >
          10 módulos integrados para criadores brasileiros crescerem mais rápido.
        </div>

        {/* Module pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 900 }}>
          {['Roteiros', 'Carrossel', 'Thumbnail', 'Stories', 'Oratória', 'Mídia Kit', 'Métricas'].map((m) => (
            <div
              key={m}
              style={{
                padding: '8px 18px',
                borderRadius: 999,
                border: '1px solid rgba(99,102,241,0.25)',
                background: 'rgba(99,102,241,0.10)',
                color: '#a5b4fc',
                fontSize: 17,
                fontWeight: 600,
              }}
            >
              {m}
            </div>
          ))}
        </div>

        {/* Domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 16,
            color: '#3a3a5a',
            letterSpacing: '0.5px',
          }}
        >
          iarahubapp.com.br
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
