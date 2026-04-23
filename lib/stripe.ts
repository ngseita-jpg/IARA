import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

export const PRICE_IDS = {
  plus:          process.env.STRIPE_PRICE_PLUS!,
  premium:       process.env.STRIPE_PRICE_PREMIUM!,
  profissional:  process.env.STRIPE_PRICE_PROFISSIONAL!,
  agencia:       process.env.STRIPE_PRICE_AGENCIA!,
} as const

export type PlanoStripe = keyof typeof PRICE_IDS

// Preços públicos (mensal) em BRL — fonte única de verdade
export const PRECOS_BRL = {
  plus:         59.90,
  premium:      129.00,
  profissional: 249.00,
  agencia:      499.00,
} as const

export const PRECOS_ANUAL_BRL = {
  plus:         538.80,   // 59,90 × 12 × 0,75
  premium:      1161.00,  // 129,00 × 12 × 0,75
  profissional: 2241.00,  // 249,00 × 12 × 0,75
  agencia:      4491.00,  // 499,00 × 12 × 0,75
} as const

export function formatarPrecoMensal(plano: string): string {
  const valor = PRECOS_BRL[plano as keyof typeof PRECOS_BRL]
  if (valor === undefined) return ''
  return `R$ ${valor.toFixed(2).replace('.', ',')}`
}

export function labelPlano(plano: string): string {
  const nomes: Record<string, string> = {
    free:         'Gratuito',
    trial:        'Trial (3 dias)',
    plus:         'Plus',
    premium:      'Premium',
    profissional: 'Profissional',
    agencia:      'Agência',
  }
  const nome = nomes[plano] ?? plano
  const preco = formatarPrecoMensal(plano)
  return preco ? `${nome} — ${preco}/mês` : nome
}

export function priceIdToPlano(priceId: string): string | null {
  for (const [plano, id] of Object.entries(PRICE_IDS)) {
    if (id === priceId) return plano
  }
  return null
}
