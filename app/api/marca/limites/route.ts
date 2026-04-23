import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  LIMITES_MARCA, FEATURES_MARCA, NOME_PLANO_MARCA,
  inicioMesAtual, type PlanoMarca,
} from '@/lib/limitesMarca'

export const runtime = 'nodejs'

/**
 * Retorna estado atual de plano + features habilitadas + uso/limite de cada recurso.
 * Consumido pelo dashboard da marca pra mostrar barras de progresso e bloqueios.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: brand } = await admin
    .from('brand_profiles')
    .select('id, plano, plano_periodo')
    .eq('user_id', user.id)
    .maybeSingle()

  const plano = (brand?.plano ?? 'free') as PlanoMarca
  const brandId = brand?.id

  // Conta uso atual em paralelo
  const [campanhasAtivas, produtosAfiliacao, cuponsAtivos, criadoresSalvos, chatMsgMes, roiAnalisesMes] =
    await Promise.all([
      brandId
        ? admin.from('vagas').select('*', { count: 'exact', head: true }).eq('brand_id', brandId).eq('status', 'aberta')
        : Promise.resolve({ count: 0 }),
      brandId
        ? admin.from('produtos_afiliados').select('*', { count: 'exact', head: true }).eq('brand_id', brandId).eq('ativo', true)
        : Promise.resolve({ count: 0 }),
      brandId
        ? admin.from('afiliados').select('*', { count: 'exact', head: true }).eq('brand_id', brandId)
        : Promise.resolve({ count: 0 }),
      brandId
        ? admin.from('criadores_salvos').select('*', { count: 'exact', head: true }).eq('brand_id', brandId)
        : Promise.resolve({ count: 0 }),
      admin.from('marca_chat_mensagens').select('*', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('role', 'user').gte('created_at', inicioMesAtual()),
      admin.from('marca_roi_analises').select('*', { count: 'exact', head: true })
        .eq('user_id', user.id).gte('created_at', inicioMesAtual()),
    ])

  return NextResponse.json({
    plano,
    plano_label: NOME_PLANO_MARCA[plano],
    plano_periodo: brand?.plano_periodo ?? 'mensal',
    limites: LIMITES_MARCA[plano],
    features: FEATURES_MARCA[plano],
    uso: {
      campanha_ativa:     campanhasAtivas.count ?? 0,
      produto_afiliacao:  produtosAfiliacao.count ?? 0,
      cupom_ativo:        cuponsAtivos.count ?? 0,
      criador_salvo:      criadoresSalvos.count ?? 0,
      chat_msg_mes:       chatMsgMes.count ?? 0,
      roi_analise_mes:    roiAnalisesMes.count ?? 0,
    },
    upgrade_url: '/empresas#planos',
  })
}
