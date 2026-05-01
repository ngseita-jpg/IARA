// Sistema de limites por plano — sincronizado com pricing-section.tsx
// Sem Stripe ainda: todos os usuários são 'free' por padrão.
// Quando Stripe for integrado, basta ler o campo `plano` do creator_profiles.

export type Plano = 'free' | 'trial' | 'plus' | 'premium' | 'profissional' | 'agencia'

export type TipoUso =
  | 'roteiro'
  | 'carrossel'
  | 'thumbnail'
  | 'stories'
  | 'oratorio'
  | 'midia_kit'
  | 'fotos'
  | 'temas'
  | 'corte'      // vídeos do YouTube analisados pra virar cortes
  | 'metricas'   // análise IA de métricas (Opus, caro)
  | 'persona'    // (re)geração da persona do criador (Sonnet)

// null = ilimitado
// Free: demo mínima pós-registro (1 de cada/mês) — força conversão pro trial/pago
// Trial: 3 dias pagos (Netflix-style) — limite de aprendizado
export const LIMITES: Record<Plano, Record<TipoUso, number | null>> = {
  free: {
    roteiro:    1,
    carrossel:  1,
    thumbnail:  1,
    stories:    1,
    oratorio:   0,
    midia_kit:  0,
    fotos:      3,
    temas:      1,
    corte:      0,   // gratuito não tem — gancho de conversão
    metricas:   0,   // análise IA de métricas só pra pagantes (modelo Opus = caro)
    persona:    2,   // 2 regenerações/mês — após criar perfil, pode refinar
  },
  trial: {
    roteiro:    2,
    carrossel:  1,
    thumbnail:  2,
    stories:    2,
    oratorio:   2,
    midia_kit:  2,
    fotos:      5,
    temas:      2,
    corte:      1,
    metricas:   1,
    persona:    3,
  },
  plus: {
    roteiro:    10,
    carrossel:  7,
    thumbnail:  7,
    stories:    7,
    oratorio:   3,
    midia_kit:  5,
    fotos:      25,
    temas:      7,
    corte:      3,
    metricas:   0,   // Plus não tem métricas IA (alinhado com pricing)
    persona:    5,
  },
  premium: {
    roteiro:    20,
    carrossel:  18,
    thumbnail:  18,
    stories:    18,
    oratorio:   8,
    midia_kit:  null,
    fotos:      80,
    temas:      15,
    corte:      10,
    metricas:   5,
    persona:    10,
  },
  profissional: {
    roteiro:    null,
    carrossel:  null,
    thumbnail:  null,
    stories:    null,
    oratorio:   null,
    midia_kit:  null,
    fotos:      null,
    temas:      null,
    corte:      null,
    metricas:   null,
    persona:    null,
  },
  agencia: {
    roteiro:    null,
    carrossel:  null,
    thumbnail:  null,
    stories:    null,
    oratorio:   null,
    midia_kit:  null,
    fotos:      null,
    temas:      null,
    corte:      null,
    metricas:   null,
    persona:    null,
  },
}

export const NOME_PLANO: Record<Plano, string> = {
  free:         'Gratuito',
  trial:        'Trial (3 dias)',
  plus:         'Plus',
  premium:      'Premium',
  profissional: 'Profissional',
  agencia:      'Agência',
}

export function getLimite(plano: Plano, tipo: TipoUso): number | null {
  return LIMITES[plano]?.[tipo] ?? null
}

/** Início do mês atual em ISO string */
export function inicioMesAtual(): string {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString()
}
