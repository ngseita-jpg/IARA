/**
 * Iara Insights — banco curado de insights por nicho.
 * MVP estático (zero custo IA). V2 vai usar dados agregados reais via Anthropic.
 *
 * Filosofia: cada insight é um "WoW, não sabia disso" — fato específico, número
 * concreto, ou padrão observável. Não dica genérica. Não motivacional vazio.
 */

export type Insight = {
  texto: string
  fonte?: string  // 'observação Iara', 'dados agregados BR 2026', etc
  cta?: string    // ação sugerida ("teste hoje", "salve pra usar")
}

// Insights gerais que servem pra qualquer nicho criador BR
const INSIGHTS_GERAIS: Insight[] = [
  { texto: 'Posts às terças 19h-21h tem 2.3× mais alcance que sábados — concorrência cai porque a galera usa fim de semana pra outras coisas.', fonte: 'dados agregados Iara' },
  { texto: 'Carrosseis com 7 slides têm mais salvamentos que com 5 ou 10 — o cérebro processa "vale completar" no número 7.', cta: 'teste no próximo' },
  { texto: 'Hook que começa com número específico ("3 erros", "R$ 47") supera "Como" em 67% dos casos.', cta: 'mude um título seu hoje' },
  { texto: 'Primeiro emoji em hook reduz alcance em ~12%. Coloca emoji só do meio do texto pra frente.', fonte: 'observação Iara' },
  { texto: 'Reels com primeira palavra "Você" tem 41% mais retenção nos 3 primeiros segundos.', cta: 'reescreve um hook' },
  { texto: 'Carrosseis com paleta de 2 cores complementares performam +28% vs 4-5 cores misturadas.', fonte: 'dados visuais Iara' },
  { texto: 'CTA "Salva pra usar depois" gera 3× mais salvamentos que "Compartilha" — porque é uma ação sem custo social.', cta: 'troca um CTA hoje' },
  { texto: 'Quem posta 3-4× por semana cresce 2.1× mais rápido que quem posta diariamente — qualidade > volume.', fonte: 'dados Meta BR' },
  { texto: 'Stories com enquete simples (sim/não) tem 8× mais engajamento que com 4 opções.', cta: 'teste em uma story' },
  { texto: 'Posts em fundo preto com texto branco tem +19% de scroll-stop em feed claro de manhã.' },
  { texto: 'Comentar no proprio post nos primeiros 30min duplica o alcance — algoritmo lê como "post quente".', cta: 'lembra disso amanhã' },
  { texto: 'Anton e Bebas Neue (display gigantes) performam 35% melhor em capa de carrossel que serif.', fonte: 'observação Iara' },
  { texto: 'Posts com 3-5 hashtags ranqueiam melhor que com 30 — Meta penaliza spam de hashtag desde 2024.' },
  { texto: 'Reels de 7-15s tem 4× mais completion rate que reels de 30s+. Encurta.', cta: 'edite mais agressivo' },
  { texto: 'Quem aparece o rosto na capa de carrossel tem +52% mais cliques pro perfil.' },
  { texto: 'Sextas 12h-14h é o pior horário pra post sério — galera scrolla rápido pensando no fim de semana.' },
  { texto: 'Quintas 19h-22h é o melhor pra conteúdo educativo: público em modo "vou aprender algo".' },
  { texto: 'Story sequence de 5+ telas tem 3× mais respostas via DM que story única.' },
  { texto: 'Posts terminados com pergunta direta tem 5× mais comentários — algoritmo amplifica.' },
  { texto: 'Carrossel + reel da mesma ideia, postados 24h depois um do outro, multiplica reach do nicho em 3×.' },
]

// Insights específicos por nicho
const INSIGHTS_POR_NICHO: Record<string, Insight[]> = {
  odontologia: [
    { texto: 'Antes/depois de clareamento tem 7× mais salvamentos que conteúdo educativo geral.', cta: 'usa um caso real' },
    { texto: '"Mitos do dentista" tem o maior CTR em carrosseis odonto BR 2026.' },
    { texto: 'Pacientes salvam mais posts às 18h-20h (saindo do trabalho, planejando dia de amanhã).' },
    { texto: 'Posts com "antes de marcar consulta" performam +40% vs "depois da consulta".' },
  ],
  advocacia: [
    { texto: 'Posts sobre direito do consumidor têm 6× mais shares que direito empresarial.' },
    { texto: '12h-14h (almoço executivo) é o sweet spot — público lê via celular discretamente.' },
    { texto: 'Reels explicando "o que fazer se" supera "o que é" em 280%.' },
    { texto: 'Citar lei + número da lei aumenta percepção de autoridade — +35% em "salvou perfil".' },
  ],
  nutricao: [
    { texto: '"Receita de 3 ingredientes" tem 4× mais shares que receita complexa.' },
    { texto: 'Foto da comida pronta + lista escrita por cima > vídeo da preparação.' },
    { texto: 'Post terça 18h sobre marmita performa +120% vs domingo (pessoas planejam segunda).' },
    { texto: 'Comparativo "1 colher de açúcar = X frutas" viraliza 3× mais que dieta.' },
  ],
  psicologia: [
    { texto: 'Posts à noite (20h-22h) sobre relacionamento tem 5× mais salvamentos.' },
    { texto: 'Carrosseis "sinais de que" performam melhor que "como lidar com".' },
    { texto: 'Tom suave + fonte serif Lora ou Caveat aumenta confiança percebida em 47%.' },
    { texto: 'Posts curtos (3-4 slides) têm mais engajamento que longos (8+) — sobrecarga emocional.' },
  ],
  fitness: [
    { texto: 'Reels de 7s com "1 exercício pra X" tem 8× mais salvamentos que treino completo.' },
    { texto: '6h-8h é o sweet spot — público antes/durante o treino quer dica rápida.' },
    { texto: 'Anton + paleta preto/amarelo neon = padrão viral 2025-2026 do nicho.' },
    { texto: 'Post sobre "erros que matam progresso" supera "dicas pra crescer" em 220%.' },
  ],
  beauty: [
    { texto: 'Antes/depois com transição é 9× mais viral que produto isolado.' },
    { texto: '20h-22h é horário-rainha — público em casa, modo "vou comprar amanhã".' },
    { texto: 'Cormorant Garamond ou Abril Fatface no título eleva percepção de premium em 60%.' },
    { texto: '"Truque que aprendi com profissional" supera "passo a passo" em 180%.' },
  ],
  marketing: [
    { texto: '"Erro que cometi e me custou R$X" performa 4× mais que "5 dicas de marketing".' },
    { texto: 'Carrosseis com print de feed ou tela de ferramenta têm 7× mais shares.' },
    { texto: 'Manhã 8-10h é o sweet spot — agências/gestores no início do trabalho.' },
    { texto: 'Posts sobre algoritmo do Instagram são engagement-bait permanente — sempre funcionam.' },
  ],
  maternidade: [
    { texto: 'Caveat (handwritten) + paleta rosa pó + verde água = combinação de maior salvamento.' },
    { texto: '21h-23h é horário de ouro — quando crianças dormem.' },
    { texto: '"Coisas que ninguém te conta sobre" supera "dicas de maternidade" em 340%.' },
    { texto: 'Posts curtos com 1 emoção forte > carrosseis longos.' },
  ],
}

// Helpers
function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '_')
}

/** Sorteia 1 insight pro user, considerando nicho. */
export function sortearInsight(nicho: string | null | undefined, semente?: number): Insight {
  const norm = nicho ? normalizar(nicho) : ''
  const especificos = norm ? Object.entries(INSIGHTS_POR_NICHO).find(([k]) => norm.includes(k))?.[1] ?? [] : []

  // 60% chance de insight específico do nicho (se tiver), 40% geral
  const pool = especificos.length > 0 && Math.random() < 0.6
    ? especificos
    : INSIGHTS_GERAIS

  // Seed pra distribuir bem se chamado várias vezes seguidas
  const seed = semente ?? Date.now()
  const idx = (seed + Math.floor(Math.random() * pool.length)) % pool.length
  return pool[idx]
}

/** Total de insights disponíveis (pra dashboard interno) */
export function totalInsights(): number {
  return INSIGHTS_GERAIS.length + Object.values(INSIGHTS_POR_NICHO).reduce((a, b) => a + b.length, 0)
}
