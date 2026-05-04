// Helpers puros pra labels de plano — SEM importar Stripe SDK.
// Pode ser usado por client components com seguranca (lib/stripe.ts inicializa
// `new Stripe(secret)` no top-level e quebra no client).

export const PRECOS_MENSAL: Record<string, number> = {
  plus:         59.90,
  premium:      129.00,
  profissional: 249.00,
  agencia:      499.00,
}

export function formatarPrecoMensal(plano: string): string {
  const valor = PRECOS_MENSAL[plano]
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
