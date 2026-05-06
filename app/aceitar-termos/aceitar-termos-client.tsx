'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Loader2, ExternalLink, AlertCircle, Check } from 'lucide-react'
import { TERMOS_VERSAO_ATUAL } from '@/lib/termos-versao'

export function ContaTermosClient() {
  const router = useRouter()
  const [li, setLi] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function aceitar() {
    if (!li) {
      setErro('Você precisa marcar que leu e aceita.')
      return
    }
    setEnviando(true)
    setErro(null)
    try {
      const r = await fetch('/api/perfil/aceitar-termos', { method: 'POST' })
      if (!r.ok) {
        const body = await r.json().catch(() => ({}))
        throw new Error(body.error || `Erro ${r.status}`)
      }
      router.push('/dashboard')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado. Tenta de novo.')
      setEnviando(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-[#08080f] text-[#f1f1f8] px-4 flex items-center justify-center"
      style={{
        paddingTop:    'calc(env(safe-area-inset-top, 0px) + 2rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)',
      }}
    >
      <div className="max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-iara-900/40 border border-iara-800/40 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-iara-300" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Antes de começar</h1>
          <p className="text-sm text-[#9b9bb5]">
            Bem-vindo ao Iara Hub. Pra continuar, confirme que leu nossos Termos de Uso e Política de Privacidade.
          </p>
        </div>

        <div className="rounded-2xl border border-[#1a1a2e] bg-[#13131f] p-5 mb-4 space-y-3">
          <div className="space-y-2 text-sm text-[#c1c1d8]">
            <p className="font-semibold text-iara-300">O que você está aceitando, em resumo:</p>
            <ul className="space-y-1.5 text-xs leading-relaxed">
              <li className="flex gap-2"><span className="text-iara-500 mt-0.5">•</span><span>Conta pessoal e intransferível — não compartilhar senha com ninguém.</span></li>
              <li className="flex gap-2"><span className="text-iara-500 mt-0.5">•</span><span>Cobrança recorrente após o trial de 3 dias, cancelável a qualquer momento.</span></li>
              <li className="flex gap-2"><span className="text-iara-500 mt-0.5">•</span><span>Você é responsável pelo conteúdo que publica baseado em sugestões da IA.</span></li>
              <li className="flex gap-2"><span className="text-amber-500 mt-0.5">•</span><span><strong className="text-amber-300">Banimento sem reembolso</strong> em caso de uso compartilhado, multi-conta pra burlar limites, ou ataque à plataforma.</span></li>
              <li className="flex gap-2"><span className="text-iara-500 mt-0.5">•</span><span>LGPD respeitada — você pode pedir, corrigir ou apagar seus dados a qualquer momento via <a href="mailto:ngseita@gmail.com" className="text-iara-400 hover:underline">ngseita@gmail.com</a>.</span></li>
            </ul>
          </div>

          <Link
            href="/termos"
            target="_blank"
            className="flex items-center justify-center gap-2 text-xs text-iara-400 hover:text-iara-300 py-2 rounded-lg border border-iara-800/40 hover:bg-iara-950/30 transition"
          >
            Ler termos completos <ExternalLink className="w-3 h-3" />
          </Link>
          <Link
            href="/privacidade"
            target="_blank"
            className="flex items-center justify-center gap-2 text-xs text-iara-400 hover:text-iara-300 py-2 rounded-lg border border-iara-800/40 hover:bg-iara-950/30 transition"
          >
            Ler política de privacidade <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <label
          className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
            li ? 'border-iara-700/60 bg-iara-950/30' : 'border-[#1a1a2e] bg-[#13131f] hover:border-[#2a2a4a]'
          }`}
        >
          <input
            type="checkbox"
            checked={li}
            onChange={(e) => { setLi(e.target.checked); setErro(null) }}
            className="sr-only"
          />
          <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
            li ? 'bg-iara-500 border-iara-500' : 'border-[#3a3a5a]'
          }`}>
            {li && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </div>
          <span className="text-sm text-[#c1c1d8] leading-relaxed">
            Li, compreendi e aceito os <Link href="/termos" target="_blank" className="text-iara-400 hover:underline">Termos de Uso</Link> e a <Link href="/privacidade" target="_blank" className="text-iara-400 hover:underline">Política de Privacidade</Link> (versão {TERMOS_VERSAO_ATUAL}).
          </span>
        </label>

        {erro && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {erro}
          </div>
        )}

        <button
          onClick={aceitar}
          disabled={enviando || !li}
          className="w-full mt-4 min-h-12 rounded-2xl bg-gradient-to-r from-iara-500 to-accent-purple text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {enviando ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
          ) : (
            <>Aceitar e continuar</>
          )}
        </button>

        <p className="text-center text-[10px] text-[#5a5a7a] mt-4">
          Se discorda, fecha essa aba — seu acesso fica suspenso até aceitar.
        </p>
      </div>
    </div>
  )
}
