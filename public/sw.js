// Service Worker do Iara Hub
// Estratégia: network-first com fallback de cache pra páginas estáticas e
// assets do Next.js. Não cacheia rotas /api/* nem páginas de auth.
//
// Versionado: bumpe CACHE_NAME quando quiser invalidar cache antigo.

// IMPORTANTE: bumpar a cada batch de fixes pra invalidar cache antigo nos PWAs.
// Sem isso, usuarios com app instalado continuam servindo JS antigo via cache
// e nao veem fixes (ex: /conta nao carregava porque o SW devolvia o client
// antigo sem tratamento de erro).
const CACHE_NAME = 'iara-hub-v5-2026-05-04c'
const PRECACHE = [
  '/',
  '/login',
  '/register',
  '/profissionais',
  '/manifest.webmanifest',
]

// Install: pre-cacheia rotas críticas
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
      .catch(() => null)
  )
  self.skipWaiting()
})

// Activate: limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: estratégia diferente por tipo
self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Apenas same-origin
  if (url.origin !== self.location.origin) return

  // Nunca interfere em métodos não-GET
  if (req.method !== 'GET') return

  // Pula APIs (precisam ser sempre fresh + auth)
  if (url.pathname.startsWith('/api/')) return

  // Pula auth callbacks
  if (url.pathname.startsWith('/auth/')) return

  // Pula imagens grandes geradas (PNGs ephemeral)
  if (url.pathname.includes('/renderizar')) return

  // Network-first: tenta rede, fallback cache
  event.respondWith(
    fetch(req)
      .then((res) => {
        // Cacheia response bem-sucedido (mas não opcional/redirect)
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => null)
        }
        return res
      })
      .catch(() => caches.match(req).then((cached) => cached ?? Response.error()))
  )
})
