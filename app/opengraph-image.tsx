import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Iara Hub — Assessoria com IA para Criadores'

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
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 800,
            height: 500,
            borderRadius: '50%',
            background: 'rgba(99,102,241,0.12)',
            filter: 'blur(80px)',
            display: 'flex',
          }}
        />

        {/* Logo row */}
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
              borderRadius: '50%',
              background: '#0d0d20',
              border: '2px solid rgba(99,102,241,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* 4-pointed star inline */}
            <div style={{ display: 'flex', color: '#818cf8', fontSize: 28, fontWeight: 900 }}>✦</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <span
              style={{
                fontSize: 52,
                fontWeight: 900,
                background: 'linear-gradient(90deg, #818cf8, #c084fc, #f472b6)',
                backgroundClip: 'text',
                color: 'transparent',
                letterSpacing: '-2px',
                lineHeight: 1,
                display: 'flex',
              }}
            >
              IARA
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#4a4a6a',
                letterSpacing: '6px',
                display: 'flex',
              }}
            >
              HUB
            </span>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
          }}
        >
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: '#f1f1f8',
              textAlign: 'center',
              lineHeight: 1.15,
              maxWidth: 900,
              letterSpacing: '-1px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <span>Sua assessora de comunicação&nbsp;</span>
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
        </div>

        {/* Sub */}
        <div
          style={{
            fontSize: 24,
            color: '#9b9bb5',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.5,
            marginTop: 20,
            marginBottom: 44,
            display: 'flex',
          }}
        >
          11 módulos integrados para criadores brasileiros crescerem mais rápido.
        </div>

        {/* Module pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 900 }}>
          {['Faísca Criativa', 'Roteiros', 'Carrossel', 'Thumbnail', 'Stories', 'Oratória', 'Mídia Kit'].map((m) => (
            <div
              key={m}
              style={{
                display: 'flex',
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
            display: 'flex',
          }}
        >
          iarahubapp.com.br
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
