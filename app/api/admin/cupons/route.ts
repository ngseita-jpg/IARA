import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

const OWNER_EMAIL = 'ngseita@gmail.com'

async function isOwner(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === OWNER_EMAIL
}

// Normaliza promo code para estrutura esperada pelo frontend
function normalize(promo: Stripe.PromotionCode, coupon?: Stripe.Coupon) {
  const c = coupon ?? (typeof promo.promotion?.coupon === 'object' ? promo.promotion.coupon as Stripe.Coupon : null)
  return {
    id: promo.id,
    code: promo.code,
    active: promo.active,
    times_redeemed: promo.times_redeemed,
    max_redemptions: promo.max_redemptions,
    created: promo.created,
    coupon: {
      percent_off: c?.percent_off ?? 0,
      name: c?.name ?? '',
    },
  }
}

// Listar todos os promotion codes
export async function GET() {
  if (!await isOwner()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  // Busca promos e coupons separadamente para evitar problema de expand na v22
  const [promosRes, couponsRes] = await Promise.all([
    stripe.promotionCodes.list({ limit: 100 }),
    stripe.coupons.list({ limit: 100 }),
  ])

  const couponMap = Object.fromEntries(couponsRes.data.map(c => [c.id, c]))

  const codes = promosRes.data.map(p => {
    const couponId = typeof p.promotion?.coupon === 'string' ? p.promotion.coupon : (p.promotion?.coupon as Stripe.Coupon)?.id
    return normalize(p, couponId ? couponMap[couponId] : undefined)
  })

  return NextResponse.json({ codes })
}

// Criar novo promotion code
export async function POST(req: NextRequest) {
  if (!await isOwner()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { desconto, codigo, uso_maximo } = await req.json() as {
    desconto: 10 | 100
    codigo: string
    uso_maximo?: number
  }

  // Cria ou reutiliza o coupon para essa porcentagem
  const couponsRes = await stripe.coupons.list({ limit: 100 })
  let coupon = couponsRes.data.find(c => c.percent_off === desconto && c.duration === 'forever')

  if (!coupon) {
    coupon = await stripe.coupons.create({
      percent_off: desconto,
      duration: 'forever',
      name: desconto === 100 ? 'Acesso Gratuito Influencer' : `${desconto}% de Desconto`,
    })
  }

  const promo = await stripe.promotionCodes.create({
    promotion: { type: 'coupon', coupon: coupon.id },
    code: codigo.toUpperCase().replace(/\s+/g, ''),
    max_redemptions: uso_maximo ?? undefined,
  })

  return NextResponse.json({ promo: normalize(promo, coupon) })
}

// Ativar/desativar promotion code
export async function PATCH(req: NextRequest) {
  if (!await isOwner()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id, ativo } = await req.json()
  const promo = await stripe.promotionCodes.update(id, { active: ativo })
  return NextResponse.json({ promo: normalize(promo) })
}
