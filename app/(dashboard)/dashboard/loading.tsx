export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Welcome skeleton */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="h-3 w-16 bg-[#1a1a2e] rounded mb-3" />
            <div className="h-8 w-48 bg-[#1a1a2e] rounded mb-2" />
            <div className="h-3 w-28 bg-[#1a1a2e] rounded" />
          </div>
          <div className="w-40 h-16 rounded-2xl bg-[#1a1a2e]" />
        </div>
      </div>

      {/* Quick access skeleton */}
      <div className="mb-10">
        <div className="h-3 w-24 bg-[#1a1a2e] rounded mb-4" />
        <div className="flex gap-2.5 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-none h-20 rounded-2xl bg-[#13131f] border border-[#1a1a2e]" style={{ width: '4.75rem' }} />
          ))}
        </div>
      </div>

      {/* Usage skeleton */}
      <div className="mb-10">
        <div className="h-3 w-36 bg-[#1a1a2e] rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-[#13131f] border border-[#1a1a2e]" />
          ))}
        </div>
      </div>

      {/* Modules skeleton */}
      <div>
        <div className="h-3 w-28 bg-[#1a1a2e] rounded mb-4" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-[#13131f] border border-[#1a1a2e]" />
          ))}
        </div>
      </div>
    </div>
  )
}
