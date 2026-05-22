/**
 * Helper centralizado pra montar bloco de persona do criador em prompts IA.
 *
 * Antes do fix (2026-05-17): cada rota IA tinha um bloco hardcoded com
 * fallback genérico ('criador', 'Não informado', etc). Quando o user não
 * tinha nome_artistico preenchido, a IA recebia literalmente "Nome: criador"
 * e respondia "Olá criador!" — user achava que IA errou o nome.
 *
 * Agora: helper único, defensivo, com fallback inteligente. Sem nome → omite
 * + instrui a IA a evitar vocativos genéricos em vez de inventar.
 */

import { joinArr } from './parseArr'

export type ProfileForPrompt = {
  nome_artistico?: unknown
  nicho?: unknown
  tom_de_voz?: unknown
  plataformas?: unknown
  objetivo?: unknown
  sobre?: unknown
  voz_perfil?: unknown
}

/**
 * Retorna nome do user APENAS se for string válida real.
 * Defende contra:
 *  - null / undefined
 *  - arrays (bug de schema/migrate) → coerção evitada
 *  - objetos (idem)
 *  - strings vazias / só espaço
 *  - fallback genérico salvo no banco ("criador", "Não informado")
 *  - placeholders óbvios ("amigo", "test", "nome", "user")
 */
export function safeName(profile: ProfileForPrompt | null | undefined): string | null {
  if (!profile) return null
  const raw = profile.nome_artistico
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  // Defesa contra fallback genérico que vazou pro banco em algum momento
  const placeholders = ['criador', 'criadora', 'criador!', 'amigo', 'amiga',
                        'não informado', 'nao informado', 'teste', 'test',
                        'user', 'usuario', 'usuário', 'nome', 'fulano']
  if (placeholders.includes(trimmed.toLowerCase())) return null

  return trimmed
}

/**
 * Bloco de persona padronizado pra prompts IA. Inclui só campos que existem
 * de verdade (sem fallbacks genéricos). Quando nome não está disponível,
 * adiciona instrução explícita pra IA NÃO inventar vocativo.
 *
 * Retorna string vazia se profile é null/vazio (rota decide o que fazer).
 */
export function personaPromptBlock(
  profile: ProfileForPrompt | null | undefined,
  opts: { titulo?: string } = {},
): string {
  if (!profile) return ''

  const nome = safeName(profile)
  const nichoStr = joinArr(profile.nicho)
  const tomStr = joinArr(profile.tom_de_voz)
  const plataformasStr = joinArr(profile.plataformas)
  const objetivoStr = joinArr(profile.objetivo)
  const sobre = typeof profile.sobre === 'string' ? profile.sobre.trim() : ''
  const voz = typeof profile.voz_perfil === 'string' ? profile.voz_perfil.trim() : ''

  const linhas: string[] = []
  if (nome)            linhas.push(`- Nome: ${nome}`)
  if (nichoStr)        linhas.push(`- Nicho: ${nichoStr}`)
  if (tomStr)          linhas.push(`- Tom de voz: ${tomStr}`)
  if (plataformasStr)  linhas.push(`- Plataformas principais: ${plataformasStr}`)
  if (objetivoStr)     linhas.push(`- Objetivo: ${objetivoStr}`)
  if (sobre)           linhas.push(`- Sobre: ${sobre}`)
  if (voz)             linhas.push(`- Análise vocal IA: ${voz}`)

  if (linhas.length === 0) return ''

  const titulo = opts.titulo ?? '## CONTEXTO DO CRIADOR (use TUDO isso para personalizar)'

  // Quando não tem nome, instrui a IA pra NÃO inventar vocativo genérico.
  // Sem isso, IA tendia a usar "criador!", "amigo!", "querido!" — soa robótico
  // e o user achava que a IA "errou o nome dele".
  const instrucaoSemNome = !nome
    ? '\n\n**IMPORTANTE — Nome não disponível:** NÃO use vocativos genéricos ("criador!", "amigo!", "querido criador"). Fale na 2ª pessoa direta ("você", "bora", "olha só") sem nome próprio. NÃO invente nome.'
    : ''

  return `\n\n${titulo}\n${linhas.join('\n')}${instrucaoSemNome}`
}

/**
 * Versão compacta — uma única linha por campo, sem cabeçalho. Útil quando
 * rota quer compor o bloco de outro jeito.
 */
export function personaFields(profile: ProfileForPrompt | null | undefined): {
  nome: string | null
  nicho: string
  tom: string
  plataformas: string
  objetivo: string
  sobre: string
  voz: string
  hasAny: boolean
} {
  const nome = safeName(profile)
  const nicho = profile ? joinArr(profile.nicho) : ''
  const tom = profile ? joinArr(profile.tom_de_voz) : ''
  const plataformas = profile ? joinArr(profile.plataformas) : ''
  const objetivo = profile ? joinArr(profile.objetivo) : ''
  const sobre = (profile && typeof profile.sobre === 'string') ? profile.sobre.trim() : ''
  const voz = (profile && typeof profile.voz_perfil === 'string') ? profile.voz_perfil.trim() : ''

  return {
    nome,
    nicho,
    tom,
    plataformas,
    objetivo,
    sobre,
    voz,
    hasAny: Boolean(nome || nicho || tom || plataformas || objetivo || sobre || voz),
  }
}
