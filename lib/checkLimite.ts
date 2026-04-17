// Helper server-side para verificar limite de uso antes de gerar conteúdo.
// Usa content_history, voice_analyses e user_photos (tabelas já existentes).
// Não requer migração — funciona com o schema atual.

import { type SupabaseClient } from '@supabase/supabase-js'
import { getLimite, inicioMesAtual, type Plano, type TipoUso } from './limites'

// Tabela e coluna que guarda o uso para cada tipo
const FONTE: Record<TipoUso, { tabela: string; campo_tipo?: string; valor_tipo?: string }> = {
  roteiro:    { tabela: 'content_history', campo_tipo: 'tipo', valor_tipo: 'roteiro' },
  carrossel:  { tabela: 'content_history', campo_tipo: 'tipo', valor_tipo: 'carrossel' },
  thumbnail:  { tabela: 'content_history', campo_tipo: 'tipo', valor_tipo: 'thumbnail' },
  stories:    { tabela: 'content_history', campo_tipo: 'tipo', valor_tipo: 'stories' },
  oratorio:   { tabela: 'voice_analyses' },
  midia_kit:  { tabela: 'content_history', campo_tipo: 'tipo', valor_tipo: 'midia_kit' },
  fotos:      { tabela: 'user_photos' },
}

/**
 * Conta quantas gerações o usuário já fez este mês para o tipo informado.
 */
export async function contarUsoMensal(
  supabase: SupabaseClient,
  userId: string,
  tipo: TipoUso
): Promise<number> {
  const fonte = FONTE[tipo]
  const inicio = inicioMesAtual()

  let query = supabase
    .from(fonte.tabela)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', inicio)

  if (fonte.campo_tipo && fonte.valor_tipo) {
    query = query.eq(fonte.campo_tipo, fonte.valor_tipo)
  }

  const { count } = await query
  return count ?? 0
}

/**
 * Verifica se o usuário pode gerar.
 * Retorna { permitido: true } ou { permitido: false, limite, usado, plano }
 */
export async function verificarLimite(
  supabase: SupabaseClient,
  userId: string,
  tipo: TipoUso,
  plano: Plano = 'free'
): Promise<
  | { permitido: true }
  | { permitido: false; limite: number; usado: number; plano: string }
> {
  const limite = getLimite(plano, tipo)

  // ilimitado
  if (limite === null) return { permitido: true }

  const usado = await contarUsoMensal(supabase, userId, tipo)

  if (usado >= limite) {
    return { permitido: false, limite, usado, plano }
  }

  return { permitido: true }
}

/**
 * Resposta padronizada de limite atingido (400)
 */
export function respostaLimiteAtingido(
  limite: number,
  usado: number,
  plano: string
): Response {
  return new Response(
    JSON.stringify({
      error: 'limite_atingido',
      mensagem: `Você atingiu o limite de ${limite} gerações por mês no plano ${plano}. Faça upgrade para continuar.`,
      limite,
      usado,
      plano,
    }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  )
}
