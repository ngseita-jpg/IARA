export default function DevOfficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#08080f]">
      {children}
    </div>
  )
}
