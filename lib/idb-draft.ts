// IndexedDB minimal pra drafts pesados (fotos base64) que não cabem em
// localStorage (limite ~5MB). Sem deps externas. Tudo silencioso — se IDB
// não estiver disponível (Safari private, browser muito velho), no-op.

const DB_NAME = 'iara-drafts'
const DB_VERSION = 1
const STORE = 'kv'

type Entry<T> = { data: T; ts: number; ttlHours: number }

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB unavailable'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
  })
}

export async function idbSet<T>(key: string, data: T, ttlHours = 24): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put({ data, ts: Date.now(), ttlHours } satisfies Entry<T>, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    // Sem IDB, payload muito grande, ou cota cheia — silencioso. O user
    // ainda vai conseguir trabalhar; só não vai ter recuperação automática.
  }
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB()
    const entry = await new Promise<Entry<T> | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(key)
      req.onsuccess = () => resolve(req.result as Entry<T> | undefined)
      req.onerror = () => reject(req.error)
    })
    db.close()
    if (!entry) return null
    const ttlMs = (entry.ttlHours ?? 24) * 60 * 60 * 1000
    if (Date.now() - entry.ts > ttlMs) {
      // expirou — limpa por preguica
      idbDelete(key).catch(() => {})
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
    db.close()
  } catch {/* noop */}
}
