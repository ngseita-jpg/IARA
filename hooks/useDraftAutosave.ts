'use client'

import { useEffect, useRef } from 'react'

/**
 * Salva um snapshot do estado em localStorage com debounce, com TTL pra
 * limpar drafts antigos. Pra ser usado em geradores de conteudo (roteiros,
 * thumbnail, stories etc.) — assim o usuario nao perde a geracao se fechar
 * a aba, der F5, ou navegar e voltar.
 *
 * Uso:
 *   useDraftAutosave('roteiros-v1', { tema, roteiro, formato })
 *
 * Pra restaurar use loadDraft<T>('roteiros-v1') no useState inicial.
 * Pra limpar manualmente (ex: ao "Salvar" definitivamente) use clearDraft(key).
 */
export function useDraftAutosave<T extends object>(
  key: string,
  value: T,
  options: { debounceMs?: number; ttlHours?: number; enabled?: boolean } = {},
) {
  const { debounceMs = 500, ttlHours = 24, enabled = true } = options
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return

    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      try {
        const payload = {
          v: 1,
          ts: Date.now(),
          ttlHours,
          data: value,
        }
        window.localStorage.setItem(`iara:draft:${key}`, JSON.stringify(payload))
      } catch {
        // localStorage cheio / Safari private — ignora silencioso
      }
    }, debounceMs)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [key, value, debounceMs, ttlHours, enabled])
}

/**
 * Le e retorna o draft salvo, se ainda valido (dentro do TTL).
 * Retorna null se nao existir, expirou, ou storage falhou.
 * Chamar UMA VEZ no init do useState inicial — ex:
 *   const draft = loadDraft<Form>('roteiros-v1')
 *   const [tema, setTema] = useState(draft?.tema ?? '')
 */
export function loadDraft<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(`iara:draft:${key}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { ts: number; ttlHours: number; data: T }
    const ageMs = Date.now() - parsed.ts
    const ttlMs = (parsed.ttlHours ?? 24) * 60 * 60 * 1000
    if (ageMs > ttlMs) {
      window.localStorage.removeItem(`iara:draft:${key}`)
      return null
    }
    return parsed.data
  } catch {
    return null
  }
}

/**
 * Limpa o draft. Chamar quando usuario "fecha" o trabalho de forma definitiva
 * (ex: clicou em "Salvar", ou cancelou explicitamente).
 */
export function clearDraft(key: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(`iara:draft:${key}`)
  } catch { /* noop */ }
}

/**
 * Bloqueia o usuario de fechar a aba/F5 quando ha geracao nao salva.
 * NAO funciona pra navegacao interna (Link do Next) — esse warning so aparece
 * em close-tab/F5/back-do-browser.
 */
export function useUnsavedWarning(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [enabled])
}
