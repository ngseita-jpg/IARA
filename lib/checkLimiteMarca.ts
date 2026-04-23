import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  getLimiteMarca, temFeatureMarca, inicioMesAtual,
  type PlanoMarca, type TipoRecursoMarca, type FeatureMarca,
} from '@/lib/limitesMarca'

/**
 * Verifica limite de recurso do plano de marca.
 * Retorna ok=true se pode prosseguir, ou { ok: false, resposta } pra dar return na rota.
 *
 * IMPORTANTE: sempre chamado com admin client — user_id vem do auth.getUser()
 * já verificado. RLS não interfere na checagem.
 */
export async function verificarLimiteMarca(
  userId: string,
  tipo: TipoRecursoMarca,
): Promise<
  | { ok: true; plano: PlanoMarca; brandId: string; usoAtual: number; limite: number | null }
  | { ok: false; status: number; error: string; plano: PlanoMarca; limite: number; usoAtual: number }
> {
  const admin = createAdminClient()

  const { data: brand } = await admin
    .from('brand_profiles')
    .select('id, plano')
    .eq('user_id', userId)
    .maybeSingle()

  if (!brand?.id) {
    return { ok: false, status: 403, error: 'Perfil de marca não encontrado', plano: 'free', limite: 0, usoAtual: 0 }
  }

  const plano = (brand.plano ?? 'free') as PlanoMarca
  const limite = getLimiteMarca(plano, tipo)

  // null = ilimitado
  if (limite === null) {
    return { ok: true, plano, brandId: brand.id, usoAtual: 0, limite: null }
  }

  // 0 = não permitido
  if (limite === 0) {
    return {
      ok: false,
      status: 402,   // 402 Payment Required (semânticamente certo — precisa upgrade)
      error: 'Seu plano atual não inclui esse recurso. Faça upgrade para liberar.',
      plano,
      limite: 0,
      usoAtual: 0,
    }
  }

  // Conta uso atual conforme o tipo
  const usoAtual = await contarUsoMarca(admin, brand.id, userId, tipo)

  if (usoAtual >= limite) {
    return {
      ok: false,
      status: 402,
      error: `Limite atingido: ${usoAtual}/${limite}. Faça upgrade para aumentar.`,
      plano,
      limite,
      usoAtual,
    }
  }

  return { ok: true, plano, brandId: brand.id, usoAtual, limite }
}

/** Verifica se plano libera uma feature específica (on/off, não quantitativa) */
export async function verificarFeatureMarca(
  userId: string,
  feature: FeatureMarca,
): Promise<{ ok: true; plano: PlanoMarca } | { ok: false; status: number; error: string; plano: PlanoMarca }> {
  const admin = createAdminClient()

  const { data: brand } = await admin
    .from('brand_profiles')
    .select('plano')
    .eq('user_id', userId)
    .maybeSingle()

  const plano = (brand?.plano ?? 'free') as PlanoMarca

  if (!temFeatureMarca(plano, feature)) {
    return {
      ok: false,
      status: 402,
      error: 'Esse recurso exige um plano superior. Veja /empresas#planos',
      plano,
    }
  }
  return { ok: true, plano }
}

/** Helper pra montar NextResponse uniforme de limite excedido */
export function respostaLimiteAtingidoMarca(
  res: Extract<Awaited<ReturnType<typeof verificarLimiteMarca>>, { ok: false }>,
) {
  return NextResponse.json(
    {
      error: res.error,
      plano_atual: res.plano,
      limite: res.limite,
      uso_atual: res.usoAtual,
      upgrade_url: '/empresas#planos',
    },
    { status: res.status },
  )
}

/** Conta uso do recurso pelo brand_id/user_id */
async function contarUsoMarca(
  admin: ReturnType<typeof createAdminClient>,
  brandId: string,
  userId: string,
  tipo: TipoRecursoMarca,
): Promise<number> {
  switch (tipo) {
    case 'campanha_ativa': {
      // Vagas com status 'aberta' contam como campanhas ativas
      const { count } = await admin
        .from('vagas')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', brandId)
        .eq('status', 'aberta')
      return count ?? 0
    }

    case 'produto_afiliacao': {
      const { count } = await admin
        .from('produtos_afiliados')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', brandId)
        .eq('ativo', true)
      return count ?? 0
    }

    case 'cupom_ativo': {
      const { count } = await admin
        .from('afiliados')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', brandId)
      return count ?? 0
    }

    case 'criador_salvo': {
      const { count } = await admin
        .from('criadores_salvos')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', brandId)
      return count ?? 0
    }

    case 'chat_msg_mes': {
      const { count } = await admin
        .from('marca_chat_mensagens')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('role', 'user')
        .gte('created_at', inicioMesAtual())
      return count ?? 0
    }

    case 'roi_analise_mes': {
      const { count } = await admin
        .from('marca_roi_analises')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', inicioMesAtual())
      return count ?? 0
    }

    case 'carrossel_mes': {
      const { count } = await admin
        .from('marca_content_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('tipo', 'carrossel')
        .gte('created_at', inicioMesAtual())
      return count ?? 0
    }

    case 'briefing_mes': {
      const { count } = await admin
        .from('marca_content_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('tipo', 'briefing')
        .gte('created_at', inicioMesAtual())
      return count ?? 0
    }

    case 'match_mes': {
      const { count } = await admin
        .from('marca_content_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('tipo', 'match')
        .gte('created_at', inicioMesAtual())
      return count ?? 0
    }

    default:
      return 0
  }
}
