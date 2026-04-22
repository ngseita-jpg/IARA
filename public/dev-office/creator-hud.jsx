// creator-hud.jsx

function CreatorHUD({ pontos, nicho }) {
  const b      = getBadgeIara(pontos, nicho);
  const labels = NICHO_NIVEIS[nicho] || NICHO_NIVEIS['Lifestyle'];

  return React.createElement('div', {
    style:{
      position:'fixed', top:64, left:12, width:272,
      background:'rgba(8,7,18,0.88)', borderRadius:16, padding:'15px 16px',
      border:`1px solid ${b.color}35`, backdropFilter:'blur(20px)',
      fontFamily:'Inter, sans-serif', zIndex:100,
    }
  },
    // badge row
    React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:12, marginBottom:13 } },
      React.createElement('div', {
        style:{
          width:48, height:48, borderRadius:12, fontSize:26,
          background:`linear-gradient(135deg,${b.color}28,${b.color}0e)`,
          border:`2px solid ${b.color}55`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }
      }, b.badge),
      React.createElement('div', {},
        React.createElement('div', { style:{ fontSize:15, fontWeight:700, color:b.color } }, b.label),
        React.createElement('div', { style:{ fontSize:11, color:'rgba(255,255,255,0.38)', marginTop:2 } },
          `${pontos.toLocaleString('pt-BR')} pontos`),
      ),
    ),

    // progress bar
    React.createElement('div', { style:{ marginBottom:13 } },
      React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', marginBottom:5 } },
        React.createElement('span', {
          style:{ fontSize:9, color:'rgba(255,255,255,0.35)', fontFamily:'IBM Plex Mono, monospace',
                  textTransform:'uppercase', letterSpacing:1 }
        }, b.nivel < 4 ? `→ ${labels[b.nivel+1]}` : 'NÍVEL MÁXIMO'),
        b.nivel < 4 && React.createElement('span', {
          style:{ fontSize:9.5, color:b.color, fontFamily:'IBM Plex Mono, monospace', fontWeight:700 }
        }, `${Math.round(b.pct)}%`),
      ),
      React.createElement('div', { style:{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' } },
        React.createElement('div', {
          style:{
            height:'100%', width:`${b.pct}%`, borderRadius:3, transition:'width 0.5s ease',
            background:`linear-gradient(90deg,${b.color}88,${b.color})`,
          }
        }),
      ),
    ),

    // ladder dots
    React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:4 } },
      ...labels.map((lbl, i) => {
        const active  = i <= b.nivel;
        const current = i === b.nivel;
        return React.createElement('div', {
          key:i, style:{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }
        },
          React.createElement('div', {
            style:{
              width: current ? 14 : 9, height: current ? 14 : 9, borderRadius:'50%',
              transition:'all 0.3s',
              background: active ? NIVEL_CORES[i] : 'rgba(255,255,255,0.1)',
              boxShadow: current ? `0 0 8px ${NIVEL_CORES[i]}` : 'none',
            }
          }),
          React.createElement('span', {
            style:{ fontSize:7, textAlign:'center', fontFamily:'IBM Plex Mono, monospace', lineHeight:1.2,
                    color: active ? NIVEL_CORES[i] : 'rgba(255,255,255,0.22)' }
          }, NIVEL_BADGES[i]),
        );
      }),
    ),
  );
}

Object.assign(window, { CreatorHUD });
