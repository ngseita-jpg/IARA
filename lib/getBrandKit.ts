import type { SupabaseClient } from '@supabase/supabase-js'

export type BrandKit = {
  paleta_principal: Array<{ nome: string; hex: string; uso: string }>
  fonte_titulo: string | null
  fonte_corpo: string | null
  mood_visual: string | null
  estilo_imagens: string | null
  elementos_recorrentes: string[]
  prompt_visual_compacto: string | null
}

/**
 * Helper pra outras rotas IA (carrossel, post-do-dia, thumbnail) puxarem o
 * brand kit do user e injetarem em system prompts.
 *
 * Retorna o prompt formatado pronto pra concatenar OU string vazia se user
 * nao configurou ainda. Nunca falha — degrada graciosamente.
 */
export async function getBrandKitContext(
  admin: SupabaseClient,
  userId: string,
): Promise<string> {
  try {
    const { data } = await admin
      .from('brand_kits')
      .select('paleta_principal, fonte_titulo, fonte_corpo, mood_visual, estilo_imagens, elementos_recorrentes, prompt_visual_compacto')
      .eq('user_id', userId)
      .maybeSingle()

    if (!data) return ''

    // Prefere o prompt compacto pre-formatado (gerado pela IA na extracao)
    if (data.prompt_visual_compacto) {
      return `\n\n## BRAND KIT DO CRIADOR (use pra alinhar visual)\n${data.prompt_visual_compacto}`
    }

    // Fallback: monta a partir dos campos individuais
    const partes: string[] = []
    if (data.mood_visual) partes.push(`Mood: ${data.mood_visual}`)
    if (data.fonte_titulo) partes.push(`Fonte títulos: ${data.fonte_titulo}`)
    if (data.fonte_corpo) partes.push(`Fonte corpo: ${data.fonte_corpo}`)
    if (data.estilo_imagens) partes.push(`Estilo imagens: ${data.estilo_imagens}`)
    if (Array.isArray(data.paleta_principal) && data.paleta_principal.length > 0) {
      const cores = data.paleta_principal.slice(0, 5).map((c: { nome: string; hex: string; uso: string }) => `${c.hex} (${c.uso})`).join(', ')
      partes.push(`Paleta: ${cores}`)
    }
    if (Array.isArray(data.elementos_recorrentes) && data.elementos_recorrentes.length > 0) {
      partes.push(`Elementos: ${data.elementos_recorrentes.slice(0, 4).join(', ')}`)
    }

    if (partes.length === 0) return ''
    return `\n\n## BRAND KIT DO CRIADOR (use pra alinhar visual)\n${partes.join('. ')}.`
  } catch {
    return ''
  }
}
