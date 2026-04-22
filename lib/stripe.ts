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

// Preços públicos (mensal) — em centavos pra evitar float
export const PRECOS_BRL = {
  plus:         59.90,
  premium:      129.00,
  profissional: 249.00,
  agencia:      499.00,
} as const

export function priceIdToPlano(priceId: string): string | null {
  for (const [plano, id] of Object.entries(PRICE_IDS)) {
    if (id === priceId) return plano
  }
  return null
}
