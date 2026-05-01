/**
 * Skeleton genérico pra rotas que carregam dados.
 * Usar em loading.tsx das rotas (Next.js 15 Suspense boundary).
 *
 * <RouteLoading title cards listas /> renderiza um esqueleto coerente
 * com o estilo dark da Iara enquanto a página real carrega.
 */
export function RouteLoading({
  cards = 0,
  rows = 0,
  showHeader = true,
  showStats = false,
}: {
  cards?: number
  rows?: number
  showHeader?: boolean
  showStats?: boolean
}) {
  return (
    <div className="animate-pulse px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
      {showHeader && (
        <div className="mb-8">
          <div className="h-3 w-16 bg-[#1a1a2e] rounded mb-3" />
          <div className="h-7 w-56 bg-[#1a1a2e] rounded mb-2" />
          <div className="h-3 w-72 max-w-full bg-[#1a1a2e] rounded" />
        </div>
      )}

      {showStats && (
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-[#13131f] border border-[#1a1a2e]" />
          ))}
        </div>
      )}

      {cards > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-[#13131f] border border-[#1a1a2e]" />
          ))}
        </div>
      )}

      {rows > 0 && (
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-[#13131f] border border-[#1a1a2e]" />
          ))}
        </div>
      )}
    </div>
  )
}
