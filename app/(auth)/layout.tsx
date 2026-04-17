export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Grade de pontos decorativa */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Glow roxo central */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-iara-600/6 blur-[120px] pointer-events-none" />

      {/* Glow pink canto */}
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-accent-pink/5 blur-[80px] pointer-events-none" />

      {/* Linha horizontal decorativa */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.3), transparent)' }}
      />

      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
