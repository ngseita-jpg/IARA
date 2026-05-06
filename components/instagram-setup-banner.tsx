'use client'

import { AlertCircle, ExternalLink, ChevronRight, X } from 'lucide-react'

type Props = {
  tipo: 'sem_pagina_fb' | 'ig_nao_vinculada'
  onDismiss: () => void
  onReconectar: () => void
}

export function InstagramSetupBanner({ tipo, onDismiss, onReconectar }: Props) {
  if (tipo === 'sem_pagina_fb') {
    return (
      <div className="rounded-2xl border border-amber-700/40 bg-gradient-to-br from-amber-900/30 to-orange-950/20 p-5 mb-6 relative">
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-amber-400/60 hover:text-amber-300"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-200">
              Pra conectar Instagram, você precisa de uma Página do Facebook
            </h3>
            <p className="text-xs text-amber-200/70 mt-1">
              A Meta exige isso pra qualquer ferramenta acessar dados do IG. Leva 1 minuto pra resolver.
            </p>
          </div>
        </div>

        <div className="space-y-2 ml-12">
          <a
            href="https://www.facebook.com/pages/create"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg bg-amber-950/40 hover:bg-amber-950/60 border border-amber-700/30 px-3 py-2.5 text-xs text-amber-100 transition-colors group"
          >
            <span><span className="font-bold mr-2">1.</span>Criar Página do Facebook (categoria "Empresa", nome qualquer)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          </a>

          <div className="rounded-lg bg-amber-950/40 border border-amber-700/30 px-3 py-2.5 text-xs text-amber-100/90">
            <span className="font-bold mr-2">2.</span>No Instagram (celular): Editar perfil → Configurações da conta profissional → Compartilhamento com outros apps → Facebook → escolhe a Página criada
          </div>

          <button
            onClick={onReconectar}
            className="flex items-center justify-between rounded-lg bg-iara-600 hover:bg-iara-500 px-3 py-2.5 text-xs font-bold text-white transition-colors w-full"
          >
            <span><span className="mr-2">3.</span>Voltar e conectar Instagram</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // ig_nao_vinculada
  return (
    <div className="rounded-2xl border border-orange-700/40 bg-gradient-to-br from-orange-900/30 to-red-950/20 p-5 mb-6 relative">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-orange-400/60 hover:text-orange-300"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-orange-600/30 border border-orange-500/40 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-orange-300" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-orange-200">
            Você tem Página, mas seu Instagram não tá vinculado a ela
          </h3>
          <p className="text-xs text-orange-200/70 mt-1">
            A Iara só consegue ler posts/insights se a IG Business estiver linkada à sua Página do Facebook. Conserta em 30 segundos.
          </p>
        </div>
      </div>

      <div className="space-y-2 ml-12">
        <div className="rounded-lg bg-orange-950/40 border border-orange-700/30 px-3 py-2.5 text-xs text-orange-100/90">
          <span className="font-bold mr-2">1.</span>Sua conta IG precisa estar como <strong>Profissional (Criador ou Empresa)</strong>. Confere em: Configurações da conta → Tipo de conta.
        </div>

        <div className="rounded-lg bg-orange-950/40 border border-orange-700/30 px-3 py-2.5 text-xs text-orange-100/90">
          <span className="font-bold mr-2">2.</span>Vincular: Instagram → Editar perfil → <strong>Compartilhamento com outros apps</strong> → Facebook → escolhe sua Página (NÃO "Perfil pessoal")
        </div>

        <a
          href="https://business.facebook.com/settings/instagram-accounts"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg bg-orange-950/40 hover:bg-orange-950/60 border border-orange-700/30 px-3 py-2.5 text-xs text-orange-100 transition-colors group"
        >
          <span><span className="font-bold mr-2">2b.</span>Alternativa: vincular pelo Meta Business Suite</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </a>

        <button
          onClick={onReconectar}
          className="flex items-center justify-between rounded-lg bg-iara-600 hover:bg-iara-500 px-3 py-2.5 text-xs font-bold text-white transition-colors w-full"
        >
          <span><span className="mr-2">3.</span>Voltar e conectar Instagram (escolhe a Página dessa vez)</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
