/**
 * Limites e permissões por plano de marca (B2B).
 * Único source of truth — consumido pelo backend (/api/marca/*) e frontend
 * (UI mostra features disponíveis/bloqueadas baseadas nisso).
 *
 * Importante: limites NÃO podem ser burlados via API — cada endpoint
 * que altera estado chama checkLimiteMarca() com admin client.
 */

export type PlanoMarca = 'free' | 'start' | 'pro' | 'scale' | 'enterprise'

export type TipoRecursoMarca =
  | 'campanha_ativa'        // quantas campanhas simultaneamente ativas
  | 'produto_afiliacao'     // quantos produtos de afiliação ativos
  | 'cupom_ativo'           // quantos cupons ativos por vez
  | 'criador_salvo'         // quantos criadores salvos em favoritos
  | 'chat_msg_mes'          // mensagens no Chat Estratégico IA por mês
  | 'roi_analise_mes'       // análises de ROI geradas por IA por mês
  | 'carrossel_mes'         // carrosseis gerados pela IA por mês
  | 'briefing_mes'          // briefings de campanha gerados com IA por mês
  | 'match_mes'             // buscas de Match Inteligente com IA por mês

export type FeatureMarca =
  | 'chat_ia'               // acesso ao Chat Estratégico com IA
  | 'roi_ia'                // relatórios ROI com análise IA
  | 'match_prioritario'     // aparece primeiro pra criadores relevantes
  | 'relatorios_white_label' // PDF com branding da marca
  | 'api_integracao'        // acesso à API pra automação
  | 'multi_perfis'          // mais de 1 usuário na mesma conta marca
  | 'sla_prioritario'       // suporte em horas úteis

// null = ilimitado; 0 = não permitido; número = limite
export const LIMITES_MARCA: Record<PlanoMarca, Record<TipoRecursoMarca, number | null>> = {
  free: {
    campanha_ativa: 0, produto_afiliacao: 0, cupom_ativo: 0, criador_salvo: 5,
    chat_msg_mes: 5, roi_analise_mes: 0, carrossel_mes: 1, briefing_mes: 1, match_mes: 1,
  },
  start: {
    campanha_ativa: 1, produto_afiliacao: 5, cupom_ativo: 50, criador_salvo: 50,
    chat_msg_mes: 30, roi_analise_mes: 3, carrossel_mes: 10, briefing_mes: 5, match_mes: 10,
  },
  pro: {
    campanha_ativa: 5, produto_afiliacao: null, cupom_ativo: null, criador_salvo: null,
    chat_msg_mes: null, roi_analise_mes: null, carrossel_mes: 40, briefing_mes: 20, match_mes: null,
  },
  scale: {
    campanha_ativa: null, produto_afiliacao: null, cupom_ativo: null, criador_salvo: null,
    chat_msg_mes: null, roi_analise_mes: null, carrossel_mes: null, briefing_mes: null, match_mes: null,
  },
  enterprise: {
    campanha_ativa: null, produto_afiliacao: null, cupom_ativo: null, criador_salvo: null,
    chat_msg_mes: null, roi_analise_mes: null, carrossel_mes: null, briefing_mes: null, match_mes: null,
  },
}

export const FEATURES_MARCA: Record<PlanoMarca, Record<FeatureMarca, boolean>> = {
  free: {
    chat_ia: true,             // limitado a 5 msgs
    roi_ia: false,
    match_prioritario: false,
    relatorios_white_label: false,
    api_integracao: false,
    multi_perfis: false,
    sla_prioritario: false,
  },
  start: {
    chat_ia: true,             // limitado a 30 msgs
    roi_ia: true,              // limitado a 3 análises/mês
    match_prioritario: false,
    relatorios_white_label: false,
    api_integracao: false,
    multi_perfis: false,
    sla_prioritario: false,
  },
  pro: {
    chat_ia: true,
    roi_ia: true,
    match_prioritario: true,
    relatorios_white_label: false,
    api_integracao: false,
    multi_perfis: false,
    sla_prioritario: true,
  },
  scale: {
    chat_ia: true,
    roi_ia: true,
    match_prioritario: true,
    relatorios_white_label: true,
    api_integracao: true,
    multi_perfis: true,
    sla_prioritario: true,
  },
  enterprise: {
    chat_ia: true,
    roi_ia: true,
    match_prioritario: true,
    relatorios_white_label: true,
    api_integracao: true,
    multi_perfis: true,
    sla_prioritario: true,
  },
}

export const NOME_PLANO_MARCA: Record<PlanoMarca, string> = {
  free:       'Gratuito',
  start:      'Start',
  pro:        'Pro',
  scale:      'Scale',
  enterprise: 'Enterprise',
}

export function getLimiteMarca(plano: PlanoMarca, tipo: TipoRecursoMarca): number | null {
  return LIMITES_MARCA[plano]?.[tipo] ?? null
}

export function temFeatureMarca(plano: PlanoMarca, feature: FeatureMarca): boolean {
  return FEATURES_MARCA[plano]?.[feature] ?? false
}

export function inicioMesAtual(): string {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString()
}
