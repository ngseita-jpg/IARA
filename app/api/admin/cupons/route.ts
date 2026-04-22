import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

const OWNER_EMAIL = 'ngseita@gmail.com'

async function isOwner(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === OWNER_EMAIL
}

// Listar todos os promotion codes
export async function GET() {
  if (!await isOwner()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const codes = await stripe.promotionCodes.list({ limit: 100, expand: ['data.coupon'] })
  return NextResponse.json({ codes: codes.data })
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
  const coupons = await stripe.coupons.list({ limit: 100 })
  let coupon = coupons.data.find(c => c.percent_off === desconto && c.duration === 'forever')

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

  return NextResponse.json({ promo })
}

// Desativar promotion code
export async function PATCH(req: NextRequest) {
  if (!await isOwner()) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id, ativo } = await req.json()
  const promo = await stripe.promotionCodes.update(id, { active: ativo })
  return NextResponse.json({ promo })
}
