'use client'

import Link from 'next/link'
import { Scissors, Sparkles, Bell, ArrowLeft, Youtube } from 'lucide-react'

/**
 * Placeholder "Em breve" pra módulo de Cortes do YouTube.
 * Mostrado enquanto FEATURE_FLAGS.CORTES_YT === false.
 *
 * Por que: pipeline atual de scraping é inconsistente. Esperamos integração
 * com API paga (Supadata) pra reativar com qualidade real.
 */
export function CortesEmBreve({ modo = 'criador' }: { modo?: 'criador' | 'marca' }) {
  const voltarHref = modo === 'marca' ? '/marca/dashboard' : '/dashboard'

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Voltar */}
        <Link
          href={voltarHref}
          className="inline-flex items-center gap-2 text-sm text-[#6b6b8a] hover:text-iara-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar pro dashboard
        </Link>

        {/* Card */}
        <div className="rounded-3xl border border-iara-700/30 bg-gradient-to-b from-iara-900/15 via-[#0f0f1e] to-[#0a0a14] p-8 sm:p-10 text-center shadow-2xl shadow-purple-900/10">
          {/* Ícone com badge */}
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-iara-600 to-accent-purple flex items-center justify-center shadow-2xl shadow-purple-900/40">
              <Scissors className="w-9 h-9 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[#0a0a14] text-[10px] font-black tracking-widest uppercase shadow-lg">
              Em breve
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white mb-3 leading-tight">
            Cortes do YouTube em<br />
            <span className="iara-gradient-text">construção avançada</span>
          </h1>

          <p className="text-sm text-[#9b9bb5] leading-relaxed mb-6 max-w-md mx-auto">
            Esse módulo pega um vídeo longo do YouTube e devolve trechos prontos pra Reels, Shorts e TikTok.
            Estamos refazendo a infra pra ele funcionar de forma <strong className="text-white">consistente</strong> em qualquer vídeo — sem surpresas.
          </p>

          {/* O que vai ter */}
          <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a14] p-5 mb-6 text-left">
            <p className="text-[10px] uppercase tracking-[0.3em] text-iara-400 font-bold mb-3">O que vai estar disponível</p>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2.5 text-[#c9c9d8]">
                <Sparkles className="w-4 h-4 text-iara-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-white">3 a 12 cortes</strong> selecionados pela IA por relevância e potencial viral</span>
              </li>
              <li className="flex items-start gap-2.5 text-[#c9c9d8]">
                <Sparkles className="w-4 h-4 text-iara-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-white">Hook + descrição + hashtags</strong> prontos pra cada corte, em PT-BR</span>
              </li>
              <li className="flex items-start gap-2.5 text-[#c9c9d8]">
                <Sparkles className="w-4 h-4 text-iara-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-white">Legendas .srt e .ass</strong> exportáveis pra qualquer editor</span>
              </li>
              <li className="flex items-start gap-2.5 text-[#c9c9d8]">
                <Sparkles className="w-4 h-4 text-iara-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-white">Score de qualidade</strong> 0-100 pra você priorizar o que postar primeiro</span>
              </li>
            </ul>
          </div>

          {/* CTA secundário */}
          <Link
            href={voltarHref}
            className="inline-flex items-center justify-center gap-2 px-6 min-h-12 rounded-xl bg-gradient-to-r from-iara-600 to-accent-purple text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-lg w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar pros outros módulos
          </Link>

          <p className="mt-6 text-xs text-[#5a5a7a] flex items-center justify-center gap-1.5">
            <Bell className="w-3 h-3" />
            Você será avisado por email quando os Cortes voltarem
          </p>
        </div>

        {/* Sugestão */}
        <div className="mt-6 rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e]/50 p-4 flex items-start gap-3">
          <Youtube className="w-5 h-5 text-red-400/80 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-[#9b9bb5] leading-relaxed">
            <p className="text-[#c9c9d8] font-semibold mb-1">Enquanto isso...</p>
            <p>
              Você pode usar <Link href={modo === 'marca' ? '/marca/dashboard/carrossel' : '/dashboard/roteiros'} className="text-iara-400 hover:underline">{modo === 'marca' ? 'Carrossel' : 'Roteiros'}</Link>
              {' '}colando a URL do YouTube — a Iara extrai o conteúdo do vídeo e cria material novo a partir dele.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
