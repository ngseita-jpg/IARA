'use client'

import { useEffect, useState } from 'react'

export default function PreviewPage() {
  const [time, setTime] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // ativa modo demo automaticamente
    fetch('/api/preview-mode?ativar=true').then(() => setReady(true))

    function tick() {
      const now = new Date()
      setTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#060610',
    }}>
      {/* sombra ambiente */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(124,92,252,0.12) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* corpo iPhone */}
      <div style={{
        position: 'relative',
        width: 295,
        height: 638,
        borderRadius: 50,
        background: 'linear-gradient(155deg, #2e2e3e 0%, #1a1a26 45%, #222230 100%)',
        boxShadow: `
          0 0 0 1px rgba(255,255,255,0.13),
          0 0 0 2px #0a0a12,
          inset 0 1px 0 rgba(255,255,255,0.14),
          inset 0 -1px 0 rgba(0,0,0,0.6),
          0 40px 100px rgba(0,0,0,0.75),
          0 10px 30px rgba(0,0,0,0.5)
        `,
      }}>

        {/* botão silencioso */}
        <div style={{
          position: 'absolute', left: -3, top: 105,
          width: 3.5, height: 26, borderRadius: '3px 0 0 3px',
          background: 'linear-gradient(to right, #111120, #252535)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
        }} />
        {/* volume + */}
        <div style={{
          position: 'absolute', left: -3, top: 148,
          width: 3.5, height: 50, borderRadius: '3px 0 0 3px',
          background: 'linear-gradient(to right, #111120, #252535)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
        }} />
        {/* volume - */}
        <div style={{
          position: 'absolute', left: -3, top: 208,
          width: 3.5, height: 50, borderRadius: '3px 0 0 3px',
          background: 'linear-gradient(to right, #111120, #252535)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
        }} />
        {/* power */}
        <div style={{
          position: 'absolute', right: -3, top: 162,
          width: 3.5, height: 70, borderRadius: '0 3px 3px 0',
          background: 'linear-gradient(to left, #111120, #252535)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
        }} />

        {/* tela */}
        <div style={{
          position: 'absolute',
          top: 5, left: 5, right: 5, bottom: 5,
          borderRadius: 45,
          overflow: 'hidden',
          background: '#000',
        }}>

          {/* reflexo no vidro */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 30,
            borderRadius: 45,
            background: 'linear-gradient(130deg, rgba(255,255,255,0.05) 0%, transparent 45%)',
            pointerEvents: 'none',
          }} />

          {/* status bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 48, zIndex: 20,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: '0 20px 7px',
          }}>
            <span style={{ color: '#fff', fontSize: 12.5, fontWeight: 700, letterSpacing: '-0.3px' }}>
              {time}
            </span>

            {/* Dynamic Island */}
            <div style={{
              position: 'absolute',
              left: '50%', top: 9,
              transform: 'translateX(-50%)',
              width: 98, height: 28,
              borderRadius: 20,
              background: '#000',
              boxShadow: '0 0 0 1.5px rgba(255,255,255,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 9,
              zIndex: 25,
            }}>
              <div style={{
                width: 9, height: 9, borderRadius: '50%',
                background: '#111',
                border: '1px solid #1e1e1e',
                boxShadow: 'inset 0 0 3px rgba(80,160,255,0.25)',
              }} />
              <div style={{
                width: 5, height: 5, borderRadius: '50%',
                background: '#111',
                border: '1px solid #1a1a1a',
              }} />
            </div>

            {/* ícones */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5.5 }}>
              <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
                <rect x="0" y="8" width="2.5" height="3" rx="0.6" fill="white" opacity="0.28"/>
                <rect x="3.5" y="5.5" width="2.5" height="5.5" rx="0.6" fill="white" opacity="0.5"/>
                <rect x="7" y="3" width="2.5" height="8" rx="0.6" fill="white" opacity="0.75"/>
                <rect x="10.5" y="0" width="2.5" height="11" rx="0.6" fill="white"/>
              </svg>
              <svg width="13" height="10" viewBox="0 0 20 14" fill="none">
                <circle cx="10" cy="13" r="1.8" fill="white"/>
                <path d="M5.5 8.5C6.9 7.1 8.4 6.3 10 6.3s3.1.8 4.5 2.2l1.5-1.5C14.2 5.1 12.2 4 10 4S5.8 5.1 4 7l1.5 1.5z" fill="white" opacity="0.6"/>
                <path d="M1.5 5C3.6 2.9 6.6 1.5 10 1.5S16.4 2.9 18.5 5L20 3.5C17.5 1.3 13.9 0 10 0S2.5 1.3 0 3.5L1.5 5z" fill="white" opacity="0.28"/>
              </svg>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  position: 'relative',
                  width: 21, height: 11,
                  borderRadius: 3.5,
                  border: '1.5px solid rgba(255,255,255,0.42)',
                }}>
                  <div style={{
                    position: 'absolute',
                    left: 2, top: 2, bottom: 2, right: '25%',
                    background: 'white',
                    borderRadius: 1.5,
                  }} />
                </div>
                <div style={{
                  width: 2, height: 5, marginLeft: 1,
                  borderRadius: '0 1px 1px 0',
                  background: 'rgba(255,255,255,0.32)',
                }} />
              </div>
            </div>
          </div>

          {/* iframe */}
          {ready && (
            <iframe
              src="/"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 'none',
                background: '#0a0a14',
              }}
              title="Iara"
            />
          )}

          {!ready && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#0a0a14',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '2px solid rgba(124,92,252,0.3)',
                borderTop: '2px solid #7c5cfc',
                animation: 'spin 0.8s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {/* home indicator */}
          <div style={{
            position: 'absolute', bottom: 7,
            left: '50%', transform: 'translateX(-50%)',
            width: 95, height: 4, borderRadius: 3,
            background: 'rgba(255,255,255,0.22)',
            zIndex: 20,
          }} />
        </div>

        {/* reflexo no corpo */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '42%', borderRadius: '50px 50px 0 0',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.04), transparent)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  )
}
