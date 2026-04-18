'use client'

import { useEffect, useState } from 'react'

// Dimensões reais do iPhone 15 Pro (chassis externo)
const PW = 393
const PH = 852

export default function PreviewPage() {
  const [time, setTime]   = useState('09:41')
  const [ready, setReady] = useState(false)
  const [scale, setScale] = useState(0.85)

  useEffect(() => {
    fetch('/api/preview-mode?ativar=true').then(() => setReady(true))

    function tick() {
      const n = new Date()
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`)
    }
    tick()
    const clock = setInterval(tick, 30000)

    function resize() {
      const sh = (window.innerHeight - 40) / PH
      const sw = (window.innerWidth  - 40) / PW
      setScale(Math.min(sh, sw, 0.95))
    }
    resize()
    window.addEventListener('resize', resize)
    return () => { clearInterval(clock); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#06060f', overflow: 'hidden',
    }}>

      {/* glow ambiente */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 60%, rgba(99,102,241,0.13) 0%, transparent 60%)',
      }} />

      {/* wrapper de escala */}
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        willChange: 'transform',
      }}>

        {/* ── chassis iPhone ─────────────────────────────────── */}
        <div style={{
          position: 'relative',
          width: PW, height: PH,
          borderRadius: 55,
          background: 'linear-gradient(160deg, #3a3a4a 0%, #1c1c2a 40%, #252535 100%)',
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.12),
            0 0 0 2.5px #09090f,
            inset 0 1px 0 rgba(255,255,255,0.15),
            inset 0 -1px 0 rgba(0,0,0,0.55),
            0 60px 120px rgba(0,0,0,0.8),
            0 20px 50px rgba(0,0,0,0.55),
            0  4px 12px rgba(99,102,241,0.08)
          `,
        }}>

          {/* botão silencioso */}
          <Btn side="left"  top={115} h={28}  />
          {/* volume + */}
          <Btn side="left"  top={168} h={56}  />
          {/* volume - */}
          <Btn side="left"  top={234} h={56}  />
          {/* power */}
          <Btn side="right" top={178} h={76}  />

          {/* ── tela ─────────────────────────────────────────── */}
          <div style={{
            position: 'absolute',
            top: 6, left: 6, right: 6, bottom: 6,
            borderRadius: 50,
            overflow: 'hidden',
            background: '#000',
          }}>

            {/* reflexo vidro */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 40, borderRadius: 50,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%)',
              pointerEvents: 'none',
            }} />

            {/* status bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: 54, zIndex: 30,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
              padding: '0 22px 8px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)',
              pointerEvents: 'none',
            }}>
              <span style={{ color:'#fff', fontSize:14, fontWeight:700, letterSpacing:'-0.4px', fontFamily:'system-ui' }}>
                {time}
              </span>

              {/* Dynamic Island */}
              <div style={{
                position: 'absolute', left: '50%', top: 10,
                transform: 'translateX(-50%)',
                width: 120, height: 34, borderRadius: 24,
                background: '#000',
                boxShadow: '0 0 0 1.5px rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11,
                zIndex: 35,
              }}>
                <div style={{ width:11, height:11, borderRadius:'50%', background:'#0a0a0a', border:'1px solid #1c1c1c', boxShadow:'inset 0 0 4px rgba(80,160,255,0.2)' }} />
                <div style={{ width: 6,  height: 6,  borderRadius:'50%', background:'#0a0a0a', border:'1px solid #181818' }} />
              </div>

              {/* icons */}
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {/* signal */}
                <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
                  <rect x="0"   y="9"   width="2.8" height="3"   rx="0.6" fill="white" opacity="0.3"/>
                  <rect x="3.8" y="6"   width="2.8" height="6"   rx="0.6" fill="white" opacity="0.55"/>
                  <rect x="7.6" y="3"   width="2.8" height="9"   rx="0.6" fill="white" opacity="0.8"/>
                  <rect x="11.2" y="0"  width="2.8" height="12"  rx="0.6" fill="white"/>
                </svg>
                {/* wifi */}
                <svg width="14" height="11" viewBox="0 0 20 14" fill="none">
                  <circle cx="10" cy="13.5" r="1.8" fill="white"/>
                  <path d="M5.5 8.8C6.9 7.3 8.4 6.5 10 6.5s3.1.8 4.5 2.3l1.5-1.5C14.2 5.3 12.2 4.1 10 4.1S5.8 5.3 4 7.3l1.5 1.5z" fill="white" opacity="0.55"/>
                  <path d="M1.5 5.2C3.6 3 6.6 1.5 10 1.5S16.4 3 18.5 5.2L20 3.7C17.5 1.4 13.9 0 10 0S2.5 1.4 0 3.7L1.5 5.2z" fill="white" opacity="0.28"/>
                </svg>
                {/* battery */}
                <div style={{ display:'flex', alignItems:'center' }}>
                  <div style={{ position:'relative', width:24, height:12, borderRadius:3.5, border:'1.5px solid rgba(255,255,255,0.4)' }}>
                    <div style={{ position:'absolute', left:2, top:2, bottom:2, right:'18%', background:'white', borderRadius:1.5 }} />
                  </div>
                  <div style={{ width:2, height:6, marginLeft:1, borderRadius:'0 1px 1px 0', background:'rgba(255,255,255,0.3)' }} />
                </div>
              </div>
            </div>

            {/* ── iframe ─────────────────────────────────────── */}
            {ready ? (
              <iframe
                src="/"
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  border: 'none',
                  background: '#08080f',
                  borderRadius: 50,
                }}
                title="Iara Preview"
              />
            ) : (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: '#08080f', gap: 14,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: '2.5px solid rgba(99,102,241,0.25)',
                  borderTopColor: '#6366f1',
                  animation: 'spin 0.75s linear infinite',
                }} />
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontFamily:'system-ui' }}>
                  carregando...
                </span>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            )}

            {/* home indicator */}
            <div style={{
              position: 'absolute', bottom: 8,
              left: '50%', transform: 'translateX(-50%)',
              width: 110, height: 4.5, borderRadius: 3,
              background: 'rgba(255,255,255,0.2)',
              zIndex: 30, pointerEvents: 'none',
            }} />
          </div>

          {/* reflexo chassis superior */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '38%',
            borderRadius: '54px 54px 0 0',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.045), transparent)',
            pointerEvents: 'none',
          }} />
        </div>
      </div>
    </div>
  )
}

/* botão lateral */
function Btn({ side, top, h }: { side: 'left'|'right'; top: number; h: number }) {
  const isLeft = side === 'left'
  return (
    <div style={{
      position: 'absolute',
      [isLeft ? 'left' : 'right']: -4,
      top,
      width: 4, height: h,
      borderRadius: isLeft ? '3px 0 0 3px' : '0 3px 3px 0',
      background: 'linear-gradient(to ' + (isLeft ? 'right' : 'left') + ', #0e0e1c, #2a2a3a)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.09)',
    }} />
  )
}
