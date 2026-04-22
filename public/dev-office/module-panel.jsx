// module-panel.jsx

function ModulePanel({ module, plano, onClose }) {
  if (!module) return null;
  const lim = module.limits[plano];
  const unlimited = lim === Infinity;
  const pct = unlimited ? 0 : (module.currentUsage / lim) * 100;
  const barColor = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : module.color;
  const planKeys = ['free','plus','premium','profissional'];

  const S = {
    panel: {
      position:'fixed', right:0, top:0, bottom:0, width:440,
      background:'rgba(8,7,18,0.97)', borderLeft:`1px solid ${module.color}30`,
      backdropFilter:'blur(24px)', display:'flex', flexDirection:'column',
      fontFamily:'Inter, sans-serif', zIndex:200,
      animation:'panelIn 0.28s cubic-bezier(0.22,1,0.36,1)',
    },
    hdr: { padding:'20px 22px 16px', borderBottom:`1px solid ${module.color}18` },
    scroll: { flex:1, overflowY:'auto', padding:'18px 22px' },
    foot: { padding:'14px 22px', borderTop:`1px solid ${module.color}18` },
    label: { fontSize:9, color:'rgba(255,255,255,0.38)', textTransform:'uppercase',
             letterSpacing:1.2, fontFamily:'IBM Plex Mono, monospace', marginBottom:7 },
    metricCard: { background:'rgba(255,255,255,0.03)', borderRadius:10,
                  padding:'11px 13px', border:'1px solid rgba(255,255,255,0.06)' },
    planCard: (active) => ({
      borderRadius:9, padding:'10px 8px', textAlign:'center',
      background: active ? `${module.color}18` : 'rgba(255,255,255,0.03)',
      border: `1px solid ${active ? module.color+'55' : 'rgba(255,255,255,0.06)'}`,
    }),
  };

  return React.createElement('div', { style: S.panel },
    // header
    React.createElement('div', { style: S.hdr },
      React.createElement('div', { style:{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' } },
        React.createElement('div', {},
          React.createElement('div', { style:{ fontSize:20, fontWeight:700, color:'white' } }, module.name),
          React.createElement('div', { style:{ fontSize:11.5, color:module.color, marginTop:2 } },
            `${module.npc} · ${module.npcRole}`),
          React.createElement('div', { style:{ fontSize:11.5, color:'rgba(255,255,255,0.42)', marginTop:6, lineHeight:1.5, maxWidth:340 } },
            module.desc),
        ),
        React.createElement('button', {
          onClick: onClose,
          style:{ background:'transparent', border:'none', color:'rgba(255,255,255,0.35)',
                  fontSize:20, cursor:'pointer', padding:'2px 6px', lineHeight:1 },
        }, '✕'),
      ),
    ),

    // scroll body
    React.createElement('div', { style: S.scroll },

      // usage
      React.createElement('div', { style:{ marginBottom:20 } },
        React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', marginBottom:7 } },
          React.createElement('span', { style: S.label }, 'USO DO MÊS'),
          React.createElement('span', { style:{ fontSize:13, fontWeight:700, color:barColor, fontFamily:'IBM Plex Mono, monospace' } },
            unlimited ? '∞  Ilimitado' : `${module.currentUsage} / ${lim}`),
        ),
        !unlimited && React.createElement('div', {
          style:{ height:7, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden' }
        },
          React.createElement('div', {
            style:{ height:'100%', width:`${Math.min(100,pct)}%`, background:barColor,
                    borderRadius:4, transition:'width 0.6s ease' }
          }),
        ),
      ),

      // 2×2 metrics
      React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:20 } },
        ...[
          { label:'Última geração', value: module.lastGen },
          { label:'Total histórico', value: module.totalHist },
          { label:'Pontos ganhos',   value: `+${module.ptsTotal} pts` },
          { label:'Pts / ação',      value: `+${module.pts} pts` },
        ].map((m,i) => React.createElement('div', { key:i, style: S.metricCard },
          React.createElement('div', { style: S.label }, m.label),
          React.createElement('div', { style:{ fontSize:15, fontWeight:700, color:'white' } }, String(m.value)),
        )),
      ),

      // output
      React.createElement('div', { style:{ marginBottom:20 } },
        React.createElement('div', { style: S.label }, 'SAÍDA TÍPICA'),
        React.createElement('div', {
          style:{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'10px 13px',
                  border:`1px solid ${module.color}25` }
        },
          React.createElement('code', {
            style:{ fontSize:12, color:module.color, fontFamily:'IBM Plex Mono, monospace' }
          }, module.output),
        ),
      ),

      // plan limits table
      React.createElement('div', { style:{ marginBottom:6 } },
        React.createElement('div', { style: S.label }, 'LIMITES POR PLANO'),
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:7 } },
          ...planKeys.map(key => {
            const pi = IARA_PLANOS[key];
            const l  = module.limits[key];
            const active = key === plano;
            return React.createElement('div', { key, style: S.planCard(active) },
              React.createElement('div', { style:{ fontSize:8.5, color:pi.color, fontWeight:700,
                                                   fontFamily:'IBM Plex Mono, monospace', marginBottom:5 } }, pi.label),
              React.createElement('div', { style:{ fontSize:18, fontWeight:800,
                                                   color: active ? module.color : 'rgba(255,255,255,0.55)' } },
                l === Infinity ? '∞' : l),
            );
          }),
        ),
      ),
    ),

    // footer
    React.createElement('div', { style: S.foot },
      React.createElement('a', {
        href: module.route, target: '_blank',
        style:{
          display:'block', padding:'12px 16px', textAlign:'center', borderRadius:11,
          background:`linear-gradient(135deg, ${module.color}, ${module.color}bb)`,
          fontSize:12.5, fontWeight:700, color:'white', textDecoration:'none',
          boxShadow:`0 4px 20px ${module.color}40`,
        },
      }, `Abrir módulo →  ${module.route}`),
    ),
  );
}

Object.assign(window, { ModulePanel });
