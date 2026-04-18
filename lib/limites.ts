// Sistema de limites por plano — sincronizado com pricing-section.tsx
// Sem Stripe ainda: todos os usuários são 'free' por padrão.
// Quando Stripe for integrado, basta ler o campo `plano` do creator_profiles.

export type Plano = 'free' | 'plus' | 'premium' | 'profissional'

export type TipoUso =
  | 'roteiro'
  | 'carrossel'
  | 'thumbnail'
  | 'stories'
  | 'oratorio'
  | 'midia_kit'
  | 'fotos'
  | 'temas'

// null = ilimitado
export const LIMITES: Record<Plano, Record<TipoUso, number | null>> = {
  free: {
    roteiro:    3,
    carrossel:  2,
    thumbnail:  2,
    stories:    2,
    oratorio:   1,
    midia_kit:  1,
    fotos:      5,
    temas:      2,
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
  },
}

export const NOME_PLANO: Record<Plano, string> = {
  free: 'Gratuito',
  plus: 'Plus',
  premium: 'Premium',
  profissional: 'Profissional',
}

export function getLimite(plano: Plano, tipo: TipoUso): number | null {
  return LIMITES[plano]?.[tipo] ?? null
}

/** Início do mês atual em ISO string */
export function inicioMesAtual(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}
