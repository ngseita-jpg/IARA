import type { SupabaseClient } from '@supabase/supabase-js'

export type FaseAtual = 'construindo' | 'crescendo' | 'monetizando' | 'escalando'

export type Missao = {
  texto: string
  concluida: boolean
  criada_em: string
}

export type SemanaMissoes = {
  semana: number
  missoes: Missao[]
}

export type BussolaPlano = {
  id: string
  diferencial: string | null
  audiencia_alvo: string | null
  marco_3m: string | null
  marco_1a: string | null
  marco_3a: string | null
  fase_atual: FaseAtual
  missoes: SemanaMissoes[]
  raciocinio_ia: string | null
  trimestre: string | null
}

/**
 * Retorna o plano ATIVO do user (1 por trimestre). Null se nunca criou.
 *
 * Usado pelo `cronograma/gerar`, `roteiros`, `temas`, `metricas/analisar`
 * pra alinhar conteudo gerado com o marco do trimestre.
 *
 * Falha aberta: se DB cair, retorna null e a rota geradora segue normal.
 */
export async function getCurrentPlan(
  supabase: SupabaseClient,
  userId: string,
): Promise<BussolaPlano | null> {
  try {
    const { data } = await supabase
      .from('bussola_planos')
      .select('id, diferencial, audiencia_alvo, marco_3m, marco_1a, marco_3a, fase_atual, missoes, raciocinio_ia, trimestre')
      .eq('user_id', userId)
      .eq('status', 'ativo')
      .maybeSingle()
    return (data as BussolaPlano | null) ?? null
  } catch {
    return null
  }
}

/**
 * Formata o plano em texto pra injetar no prompt da IA.
 * Tom conciso pra nao gastar tokens, mas com info suficiente pra direcionar.
 */
export function formatPlanoParaPrompt(plano: BussolaPlano | null): string {
  if (!plano) return ''

  const partes: string[] = ['## Plano de Carreira do Criador (Bússola)']
  if (plano.fase_atual) {
    const faseLabels: Record<FaseAtual, string> = {
      construindo: 'CONSTRUINDO autoridade (foco em provar competência)',
      crescendo: 'CRESCENDO base (foco em alcance e seguidores)',
      monetizando: 'MONETIZANDO (foco em conversão pra produtos/serviços)',
      escalando: 'ESCALANDO (foco em sistema, time, leverage)',
    }
    partes.push(`- Fase atual: ${faseLabels[plano.fase_atual]}`)
  }
  if (plano.marco_3m) partes.push(`- Marco de 3 meses: ${plano.marco_3m}`)
  if (plano.marco_1a) partes.push(`- Marco de 1 ano: ${plano.marco_1a}`)
  if (plano.diferencial) partes.push(`- Diferencial: ${plano.diferencial}`)
  if (plano.audiencia_alvo) partes.push(`- Audiência alvo: ${plano.audiencia_alvo}`)

  partes.push('\n**REGRA:** todo conteúdo gerado deve avançar o marco de 3 meses. Se for genérico ou desconectado, descarte.')

  return '\n\n' + partes.join('\n')
}
