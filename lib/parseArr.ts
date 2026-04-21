/**
 * Parse defensivo para campos que podem vir como:
 * - string JSON (novo formato multi-select): '["a","b","c"]'
 * - string simples (formato legacy): 'a'
 * - array nativo (coluna text[] do Postgres)
 * - null/undefined
 *
 * Usado para campos como tom_de_voz, objetivo, segmento, nicho que migraram
 * de single-select (string) para multi-select (string[] serializado como JSON).
 */
export function parseArr(v: unknown): string[] {
  if (v == null) return []
  if (Array.isArray(v)) return v.map(String).filter(Boolean)
  if (typeof v !== 'string') return []
  const s = v.trim()
  if (!s) return []
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean)
      return [String(parsed)]
    } catch {
      return [s]
    }
  }
  return [s]
}

/** Converte array para string legível ("a, b, c") para uso em prompts. */
export function joinArr(v: unknown, separator = ', '): string {
  return parseArr(v).join(separator)
}
