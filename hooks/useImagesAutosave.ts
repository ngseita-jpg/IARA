'use client'

import { useEffect, useRef } from 'react'
import { idbSet, idbGet, idbDelete } from '@/lib/idb-draft'

/**
 * Variante do useDraftAutosave pra payload pesado (fotos base64). Usa
 * IndexedDB porque localStorage estoura em ~5MB (3-4 fotos comprimidas já
 * passam).
 *
 * Debounce maior (1000ms) que o autosave de texto porque escrita IDB
 * é mais cara — não vale a pena escrever a cada ms.
 */
export function useImagesAutosave<T>(
  key: string,
  value: T,
  options: { debounceMs?: number; ttlHours?: number; enabled?: boolean } = {},
) {
  const { debounceMs = 1000, ttlHours = 24, enabled = true } = options
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return

    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      idbSet(`iara:draft-images:${key}`, value, ttlHours).catch(() => {})
    }, debounceMs)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [key, value, debounceMs, ttlHours, enabled])
}

export function loadImagesDraft<T>(key: string): Promise<T | null> {
  return idbGet<T>(`iara:draft-images:${key}`)
}

export function clearImagesDraft(key: string): Promise<void> {
  return idbDelete(`iara:draft-images:${key}`)
}
