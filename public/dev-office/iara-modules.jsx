// iara-modules.jsx — Data layer

const IARA_MODULES = [
  { id:'roteiros',  name:'Roteiros',      npc:'Roto',  npcRole:'Ghost Writer',       color:'#a855f7', route:'/dashboard/roteiros',
    desc:'Gera roteiros completos para vídeos, lives e podcasts com IA',
    limits:{free:3,plus:10,premium:20,profissional:Infinity}, output:'~800 palavras · estrutura completa',
    pts:5,  lastGen:'2 dias atrás',   totalHist:47, ptsTotal:235, currentUsage:2 },
  { id:'carrossel', name:'Carrossel',     npc:'Carol', npcRole:'Swipe Designer',     color:'#ec4899', route:'/dashboard/carrossel',
    desc:'Cria carrosseis otimizados para Instagram com ganchos e slides',
    limits:{free:2,plus:7,premium:18,profissional:Infinity},  output:'7 slides · 1080×1350',
    pts:5,  lastGen:'5 horas atrás',  totalHist:63, ptsTotal:315, currentUsage:1 },
  { id:'thumbnail', name:'Thumbnail',     npc:'Tito',  npcRole:'CTR Hunter',         color:'#f59e0b', route:'/dashboard/thumbnail',
    desc:'Gera conceitos e prompts de thumbnail com alta taxa de cliques',
    limits:{free:2,plus:7,premium:18,profissional:Infinity},  output:'3 conceitos · 1280×720',
    pts:5,  lastGen:'1 semana atrás', totalHist:28, ptsTotal:140, currentUsage:0 },
  { id:'stories',   name:'Stories',       npc:'Stella',npcRole:'Stories Creator',    color:'#ec4899', route:'/dashboard/stories',
    desc:'Sequências de stories com narrativa, CTAs e stickers estratégicos',
    limits:{free:2,plus:7,premium:18,profissional:Infinity},  output:'5 stories · 1080×1920',
    pts:5,  lastGen:'hoje',           totalHist:89, ptsTotal:445, currentUsage:2 },
  { id:'oratorio',  name:'Oratório',      npc:'Ora',   npcRole:'Coach de Voz',       color:'#22d3ee', route:'/dashboard/oratorio',
    desc:'Analisa áudio real e pontua confiança, energia, fluidez e emoção',
    limits:{free:1,plus:3,premium:8,profissional:Infinity},   output:'Score + feedback + exercícios',
    pts:40, lastGen:'3 dias atrás',   totalHist:12, ptsTotal:480, currentUsage:0 },
  { id:'temas',     name:'Temas',         npc:'Tina',  npcRole:'Caçadora de Trends', color:'#14b8a6', route:'/dashboard/temas',
    desc:'Descobre temas virais e tendências do nicho com ângulos únicos',
    limits:{free:2,plus:7,premium:15,profissional:Infinity},  output:'10 temas · hooks e CTAs',
    pts:5,  lastGen:'ontem',          totalHist:34, ptsTotal:170, currentUsage:1 },
  { id:'metricas',  name:'Métricas',      npc:'Meg',   npcRole:'Data Analyst',       color:'#6366f1', route:'/dashboard/metricas',
    desc:'Analisa engajamento e crescimento com insights acionáveis por IA',
    limits:{free:Infinity,plus:Infinity,premium:Infinity,profissional:Infinity}, output:'Relatório completo · insights',
    pts:10, lastGen:'hoje',           totalHist:22, ptsTotal:220, currentUsage:0 },
  { id:'metas',     name:'Metas',         npc:'Mateo', npcRole:'Goal Tracker',       color:'#10b981', route:'/dashboard/metas',
    desc:'Cria e acompanha metas de crescimento com calendário de publicações',
    limits:{free:Infinity,plus:Infinity,premium:Infinity,profissional:Infinity}, output:'Meta + calendário + checkpoints',
    pts:80, lastGen:'1 semana atrás', totalHist:8,  ptsTotal:640, currentUsage:0 },
  { id:'midia-kit', name:'Mídia Kit',     npc:'Mika',  npcRole:'Brand Presenter',    color:'#a855f7', route:'/dashboard/midia-kit',
    desc:'Gera mídia kit profissional personalizado para fechar parcerias',
    limits:{free:1,plus:5,premium:Infinity,profissional:Infinity}, output:'PDF completo · todas seções',
    pts:20, lastGen:'2 semanas atrás',totalHist:5,  ptsTotal:100, currentUsage:0 },
  { id:'fotos',     name:'Banco de Fotos',npc:'Foto',  npcRole:'Visual Bank',        color:'#eab308', route:'/dashboard/fotos',
    desc:'Banco pessoal de fotos comprimidas para usar nos módulos de IA',
    limits:{free:5,plus:25,premium:80,profissional:Infinity},  output:'Upload + compressão · 800px',
    pts:2,  lastGen:'3 dias atrás',   totalHist:18, ptsTotal:36,  currentUsage:3 },
  { id:'vagas',     name:'Vagas',         npc:'Vini',  npcRole:'Talent Matcher',     color:'#3b82f6', route:'/dashboard/vagas',
    desc:'Conecta criadores com vagas de marcas por compatibilidade de nicho',
    limits:{free:Infinity,plus:Infinity,premium:Infinity,profissional:Infinity}, output:'Match score + candidatura',
    pts:0,  lastGen:'4 dias atrás',   totalHist:7,  ptsTotal:0,   currentUsage:0 },
  { id:'afiliados', name:'Afiliados',     npc:'Afi',   npcRole:'Revenue Partner',    color:'#f59e0b', route:'/dashboard/afiliados',
    desc:'Gerencia cupons, cliques e comissões do programa de afiliados',
    limits:{free:Infinity,plus:Infinity,premium:Infinity,profissional:Infinity}, output:'Link + cupom + dashboard',
    pts:0,  lastGen:'1 semana atrás', totalHist:3,  ptsTotal:0,   currentUsage:0 },
];

const IARA_PLANOS = {
  free:         { label:'Free',    color:'#6b7280' },
  plus:         { label:'Plus',    color:'#6366f1' },
  premium:      { label:'Premium', color:'#a855f7' },
  profissional: { label:'Pro',     color:'#ec4899' },
};

const THRESHOLDS   = [0, 500, 2000, 6000, 15000];
const NIVEL_BADGES = ['🥉','🥈','🥇','💎','⭐'];
const NIVEL_CORES  = ['#cd7f32','#c0c0c0','#ffd700','#b9f2ff','#fff176'];

const NICHO_NIVEIS = {
  'Tecnologia':  ['Dev Jr','Dev Pleno','Dev Sr','Arquiteto','CTO'],
  'Gastronomia': ['Aprendiz','Cozinheiro','Chef','Gourmet','Mestre'],
  'Fitness':     ['Iniciante','Atleta','Personal','Coach','Mestre'],
  'Moda':        ['Aprendiz','Estilista','Designer','Influencer','Ícone'],
  'Lifestyle':   ['Iniciante','Explorer','Curador','Influencer','Referência'],
  'Games':       ['Noob','Player','Pro Player','Streamer','Legend'],
};

// grid 4×3, col first
const IARA_POSITIONS = [
  [0,0],[1,0],[2,0],[3,0],
  [0,1],[1,1],[2,1],[3,1],
  [0,2],[1,2],[2,2],[3,2],
];

function getNivelIara(pontos) {
  for (let i = THRESHOLDS.length - 1; i >= 0; i--)
    if (pontos >= THRESHOLDS[i]) return i;
  return 0;
}

function getBadgeIara(pontos, nicho = 'Lifestyle') {
  const nivel   = getNivelIara(pontos);
  const labels  = NICHO_NIVEIS[nicho] || NICHO_NIVEIS['Lifestyle'];
  const prev    = THRESHOLDS[nivel];
  const next    = THRESHOLDS[nivel + 1] || THRESHOLDS[nivel];
  const pct     = nivel < 4 ? Math.min(100, ((pontos - prev) / (next - prev)) * 100) : 100;
  return { nivel, badge: NIVEL_BADGES[nivel], label: labels[nivel],
           color: NIVEL_CORES[nivel], pct, next, prev };
}

Object.assign(window, {
  IARA_MODULES, IARA_PLANOS, THRESHOLDS, NIVEL_BADGES, NIVEL_CORES,
  NICHO_NIVEIS, IARA_POSITIONS, getNivelIara, getBadgeIara,
});
