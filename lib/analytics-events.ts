type GtagFn = (...args: unknown[]) => void
type FbqFn = (...args: unknown[]) => void

declare global {
  interface Window {
    gtag?: GtagFn
    fbq?: FbqFn
  }
}

function gaEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try { window.gtag?.('event', event, params) } catch { /* ignore */ }
}

function fbEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try { window.fbq?.('track', event, params) } catch { /* ignore */ }
}

export function trackSignup(method: 'email' | 'google' = 'email') {
  gaEvent('sign_up', { method })
  fbEvent('CompleteRegistration', { method })
}

export function trackStartCheckout(plano: string, valor: number) {
  gaEvent('begin_checkout', { currency: 'BRL', value: valor, items: [{ item_id: plano, item_name: `Iara ${plano}`, price: valor, quantity: 1 }] })
  fbEvent('InitiateCheckout', { currency: 'BRL', value: valor, content_ids: [plano], content_type: 'product' })
}

export function trackPurchase(plano: string, valor: number) {
  gaEvent('purchase', { currency: 'BRL', value: valor, transaction_id: `iara-${plano}-${Date.now()}`, items: [{ item_id: plano, item_name: `Iara ${plano}`, price: valor, quantity: 1 }] })
  fbEvent('Purchase', { currency: 'BRL', value: valor, content_ids: [plano], content_type: 'product' })
}

export function trackLead(tipo: 'criador' | 'marca' = 'criador') {
  gaEvent('generate_lead', { tipo })
  fbEvent('Lead', { tipo })
}
