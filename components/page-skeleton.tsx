// Skeleton genérico pra rotas internas — evita "branco" entre clicks no menu
// e pré-aloca a estrutura visual pra reduzir CLS quando a página chega.
export function PageSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-3 w-20 bg-[#1a1a2e] rounded mb-3" />
        <div className="h-8 w-56 bg-[#1a1a2e] rounded mb-2" />
        <div className="h-3 w-72 bg-[#1a1a2e] rounded" />
      </div>

      {/* Card principal */}
      <div className="space-y-3">
        <div className="h-32 rounded-2xl bg-[#13131f] border border-[#1a1a2e]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-24 rounded-2xl bg-[#13131f] border border-[#1a1a2e]" />
          <div className="h-24 rounded-2xl bg-[#13131f] border border-[#1a1a2e]" />
        </div>
        <div className="h-48 rounded-2xl bg-[#13131f] border border-[#1a1a2e]" />
      </div>
    </div>
  )
}
