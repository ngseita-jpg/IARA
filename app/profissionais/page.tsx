import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Sparkles, Check } from 'lucide-react'
import { IaraLogo } from '@/components/iara-logo'
import { NICHOS_PRO } from '@/lib/nichos-pro'

export const metadata: Metadata = {
  title: 'Iara Hub para Profissionais Liberais | IA pro seu marketing',
  description: 'Marketing com IA pra dentistas, advogados, médicos, nutricionistas, psicólogos e mais. Conteúdo de Instagram pro seu consultório/escritório, dentro do conselho regulador.',
  alternates: { canonical: 'https://iarahubapp.com.br/profissionais' },
  openGraph: {
    title: 'Iara Hub para Profissionais Liberais',
    description: '10 profissões cobertas. Conteúdo dentro do conselho regulador. 3 dias grátis.',
    url: 'https://iarahubapp.com.br/profissionais',
    siteName: 'Iara Hub',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function ProfissionaisIndex() {
  return (
    <div className="min-h-screen bg-[#08080f] text-[#f1f1f8]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#08080f]/80 border-b border-[#1a1a2e]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/">
            <IaraLogo size="sm" layout="horizontal" />
          </Link>
          <Link
            href="/register"
            className="px-4 min-h-11 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-iara-600 to-accent-purple text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Começar grátis <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-iara-600/8 blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-iara-700/40 bg-iara-900/20 text-iara-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Marketing com IA pra profissionais liberais
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black leading-[1.05] mb-5 tracking-tight">
            Sua área tem <span className="iara-gradient-text">regra própria</span>.<br />
            A Iara <span className="iara-gradient-text">conhece todas elas</span>.
          </h1>
          <p className="text-base sm:text-lg text-[#9b9bb5] max-w-2xl mx-auto leading-relaxed mb-3">
            Cada conselho regulador tem suas restrições — CFO, OAB, CFM, CFN, CFP, CREF, CRECI, COFFITO.
            A Iara foi treinada respeitando cada um. Você posta sem medo.
          </p>
          <p className="text-xs text-[#5a5a7a]">
            Escolha sua profissão abaixo:
          </p>
        </div>
      </section>

      {/* Lista de nichos */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {NICHOS_PRO.map(n => (
              <Link
                key={n.slug}
                href={`/p/${n.slug}`}
                className="group p-5 rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] hover:border-iara-700/40 hover:bg-iara-900/10 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-iara-600/20 to-accent-purple/10 border border-iara-700/30 flex items-center justify-center flex-shrink-0 text-2xl">
                    {n.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-white mb-0.5 group-hover:text-iara-300 transition-colors">{n.nome}</p>
                    <p className="text-xs text-[#6b6b8a] leading-relaxed line-clamp-2">{n.hero.subheadline.slice(0, 80)}...</p>
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-iara-400 font-semibold">
                      Ver landing
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Por que */}
      <section className="px-4 sm:px-6 py-16 bg-[#0a0a14]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            Por que <span className="iara-gradient-text">profissionais liberais</span> escolhem a Iara
          </h2>
          <div className="space-y-3">
            {[
              { titulo: 'Respeita o conselho da sua área', desc: 'Cada profissão tem normas estritas (sem promessa, sem antes/depois, sem captação). A Iara foi treinada com cada uma.' },
              { titulo: 'Mais barato que agência', desc: 'Premium custa R$ 129/mês — uma agência mediana cobra R$ 2.000-5.000.' },
              { titulo: 'Você não vira social media', desc: 'Em vez de gastar 1h por post, gasta 3-5 minutos. Hora ganha vai pro atendimento — onde você fatura.' },
              { titulo: 'Tom no SEU jeito', desc: 'No onboarding você descreve sua história e abordagem. A Iara aprende e escreve nesse tom — não genérico.' },
              { titulo: 'Tudo num só lugar', desc: 'Roteiros pra Reels, carrosseis, stories, mídia kit profissional, métricas com IA. Não precisa pular entre 5 ferramentas.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e]">
                <div className="w-7 h-7 rounded-full bg-iara-600/20 border border-iara-700/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-iara-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white mb-1">{item.titulo}</p>
                  <p className="text-sm text-[#9b9bb5] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 sm:px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-iara-600 to-accent-purple mb-6">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black mb-4 leading-tight">
            Não importa a profissão.<br />
            <span className="iara-gradient-text">A Iara cuida do seu marketing.</span>
          </h2>
          <p className="text-base text-[#9b9bb5] mb-8 max-w-xl mx-auto">
            3 dias grátis. Cancela quando quiser. Sem fidelidade.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-7 min-h-14 rounded-2xl bg-gradient-to-r from-iara-600 via-accent-purple to-accent-pink text-white text-base font-black hover:opacity-90 shadow-2xl shadow-purple-900/30"
          >
            Começar grátis agora
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a1a2e] py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5a5a7a]">
          <IaraLogo size="sm" layout="horizontal" />
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-iara-400 transition-colors">Home</Link>
            <Link href="/empresas" className="hover:text-iara-400 transition-colors">Para marcas</Link>
            <Link href="/privacidade" className="hover:text-iara-400 transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-iara-400 transition-colors">Termos</Link>
          </div>
          <span>© {new Date().getFullYear()} Iara Hub</span>
        </div>
      </footer>
    </div>
  )
}
