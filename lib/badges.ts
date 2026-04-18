// Sistema de selos e níveis de influenciador da Iara
// Cada nicho tem rótulos temáticos para Bronze → Prata → Ouro → Diamante → Elite

export const BADGES_POR_NICHO: Record<string, string[]> = {
  // Labels alinhados com os nichos do onboarding
  'Lifestyle':                      ['Explorador', 'Creator', 'Influente', 'Trendsetter', 'Ícone'],
  'Fitness e saúde':                ['Iniciante Fit', 'Ativo', 'Atleta', 'Performance', 'Elite Fit'],
  'Gastronomia':                    ['Aprendiz', 'Cozinheiro', 'Chef', 'Gourmet', 'Mestre'],
  'Moda e beleza':                  ['Estudante', 'Produtor', 'Artista', 'Expert', 'Guru'],
  'Finanças e negócios':            ['Poupador', 'Aplicador', 'Investidor', 'Trader', 'Magnata'],
  'Tecnologia':                     ['Dev Jr', 'Dev Pleno', 'Dev Sr', 'Arquiteto', 'CTO'],
  'Educação':                       ['Estudante', 'Monitor', 'Professor', 'Mestre', 'PhD'],
  'Entretenimento':                 ['Figurante', 'Ator', 'Estrela', 'Celebridade', 'Lenda'],
  'Viagem':                         ['Mochileiro', 'Viajante', 'Nômade', 'Globetrotter', 'Explorador'],
  'Esportes':                       ['Amador', 'Atleta', 'Profissional', 'Campeão', 'MVP'],
  'Games':                          ['Noob', 'Jogador', 'Pro', 'Streamer', 'Pro Player'],
  'Maternidade e família':          ['Aprendiz', 'Presente', 'Referência', 'Especialista', 'Ícone'],
  // Aliases para nichos do perfil avançado
  'Fitness e Saúde':                ['Iniciante Fit', 'Ativo', 'Atleta', 'Performance', 'Elite Fit'],
  'Finanças e Investimentos':       ['Poupador', 'Aplicador', 'Investidor', 'Trader', 'Magnata'],
  'Beleza e Moda':                  ['Estudante', 'Produtor', 'Artista', 'Expert', 'Guru'],
  'Negócios e Empreendedorismo':    ['Estagiário', 'Analista', 'Gerente', 'Diretor', 'CEO'],
  'Humor e Comédia':                ['Trainee', 'Comediante', 'Humorista', 'Stand-up', 'Mito'],
  'Música':                         ['Aprendiz', 'Músico', 'Artista', 'Astro', 'Ícone'],
  'Arte e Design':                  ['Iniciante', 'Criativo', 'Artista', 'Mestre', 'Visionário'],
}

const DEFAULT_BADGES = ['Bronze', 'Prata', 'Ouro', 'Diamante', 'Elite']

// Pontos mínimos para cada nível (índice = nível)
// Níveis difíceis por design — nível alto = vantagem em campanhas de marca
export const THRESHOLDS = [0, 500, 2000, 6000, 15000]

export const NIVEL_CORES = [
  { bg: 'bg-amber-900/30',  text: 'text-amber-400',  border: 'border-amber-700/40',  hex: '#D97706', emoji: '🥉' },
  { bg: 'bg-slate-700/30',  text: 'text-slate-300',  border: 'border-slate-500/40',  hex: '#94A3B8', emoji: '🥈' },
  { bg: 'bg-yellow-900/30', text: 'text-yellow-400', border: 'border-yellow-700/40', hex: '#F59E0B', emoji: '🥇' },
  { bg: 'bg-blue-900/30',   text: 'text-blue-400',   border: 'border-blue-700/40',   hex: '#60A5FA', emoji: '💎' },
  { bg: 'bg-purple-900/30', text: 'text-purple-400', border: 'border-purple-700/40', hex: '#A78BFA', emoji: '⭐' },
]

// Pontos por ação — calibrados para exigir comprometimento real
export const PONTOS_ACOES = {
  ANALISE_VOZ:        40,  // análise completa de oratória
  TREINO_ORATORIO:    25,  // treino avulso de voz
  META_CONCLUIDA:     80,  // meta de postagem concluída
  META_BONUS:         30,  // bônus por cumprir antes do prazo
  GERAR_ROTEIRO:       5,  // geração de roteiro
  ITEM_CALENDARIO:    15,  // item do calendário marcado como feito
}

export function getLevel(pontos: number): number {
  let nivel = 0
  for (let i = 0; i < THRESHOLDS.length; i++) {
    if (pontos >= THRESHOLDS[i]) nivel = i
  }
  return nivel
}

export function getBadgeInfo(pontos: number, nicho?: string) {
  const nivel = getLevel(pontos)
  const badges = (nicho && BADGES_POR_NICHO[nicho]) ? BADGES_POR_NICHO[nicho] : DEFAULT_BADGES
  const cor = NIVEL_CORES[nivel]
  const nextThreshold = THRESHOLDS[nivel + 1] ?? null
  const prevThreshold = THRESHOLDS[nivel]
  const progress = nextThreshold
    ? Math.min(100, Math.max(0, Math.round(((pontos - prevThreshold) / (nextThreshold - prevThreshold)) * 100)))
    : 100
  const pontosParaProximo = nextThreshold ? nextThreshold - pontos : 0

  return {
    nivel,
    badge: badges[nivel],
    proximoBadge: nivel < badges.length - 1 ? badges[nivel + 1] : null,
    cor,
    pontos,
    nextThreshold,
    prevThreshold,
    progress,
    pontosParaProximo,
  }
}
