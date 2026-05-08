'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Palette, Upload, Loader2, Sparkles, Trash2, Check, AlertCircle, X, RefreshCw,
} from 'lucide-react'
import { compressImage } from '@/lib/image-compress'

type Cor = { nome: string; hex: string; uso: string }
type BrandKit = {
  id: string
  referencias_urls: string[]
  paleta_principal: Cor[]
  fonte_titulo: string | null
  fonte_corpo: string | null
  mood_visual: string | null
  estilo_imagens: string | null
  elementos_recorrentes: string[]
  prompt_visual_compacto: string | null
  raciocinio_ia: string | null
  atualizado_em: string
}

export default function BrandKitPage() {
  const [kit, setKit] = useState<BrandKit | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [setupPendente, setSetupPendente] = useState(false)
  const [referenciasSelecionadas, setReferenciasSelecionadas] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)
  const [extraindo, setExtraindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/brand-kit')
      const data = await res.json()
      if (data.setup_pendente) {
        setSetupPendente(true)
      } else {
        setKit(data.brand_kit)
      }
    } catch {
      setErro('Erro ao carregar brand kit')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    if (referenciasSelecionadas.length + files.length > 5) {
      setErro('Máximo 5 referências')
      return
    }
    setEnviando(true)
    setErro(null)
    try {
      const novosUrls: string[] = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        // Comprime no client antes de subir (1200px @ 88%)
        const base64 = await compressImage(file, 1200, 0.88)
        // Sobe via /api/fotos/upload (mesma infra)
        const res = await fetch('/api/fotos/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagem_base64: base64, nome: `brand-${Date.now()}-${file.name}` }),
        })
        const data = await res.json()
        if (res.ok && data.photo?.signed_url) novosUrls.push(data.photo.signed_url as string)
      }
      setReferenciasSelecionadas((prev) => [...prev, ...novosUrls])
    } catch {
      setErro('Erro fazendo upload')
    } finally {
      setEnviando(false)
    }
  }

  async function extrair() {
    if (referenciasSelecionadas.length === 0) {
      setErro('Adicione pelo menos 1 imagem')
      return
    }
    setExtraindo(true)
    setErro(null)
    try {
      const res = await fetch('/api/brand-kit/extrair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencias_urls: referenciasSelecionadas }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.detalhe ? `${data.error} [${data.detalhe}]` : (data.error ?? 'Erro'))
        return
      }
      setKit(data.brand_kit)
      setReferenciasSelecionadas([])
      setSucesso('Brand kit gerado! Agora carrosséis e Post do Dia vão usar essa identidade.')
      setTimeout(() => setSucesso(null), 5000)
    } catch {
      setErro('Falha de conexão')
    } finally {
      setExtraindo(false)
    }
  }

  async function deletar() {
    if (!confirm('Apagar brand kit? Vai precisar gerar de novo.')) return
    await fetch('/api/brand-kit', { method: 'DELETE' })
    setKit(null)
  }

  if (carregando) {
    return <div className="text-center py-20 text-[#5a5a7a]">Carregando…</div>
  }

  if (setupPendente) {
    return (
      <div className="iara-card p-8 text-center">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#f1f1f8] mb-2">Setup pendente</h2>
        <p className="text-sm text-[#9b9bb5]">
          Admin precisa rodar <code>supabase/schema_brand_kit.sql</code> no Supabase.
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-iara-400 text-sm font-medium mb-2">
          <Palette className="w-4 h-4" />
          <span>Identidade visual</span>
        </div>
        <h1 className="text-3xl font-bold text-[#f1f1f8]">
          Brand <span className="iara-gradient-text">Kit</span>
        </h1>
        <p className="mt-1 text-[#9b9bb5] text-sm max-w-2xl">
          Sobe 2-5 prints de carrosséis seus que bombaram (ou que você admira). Iara extrai paleta, fontes, mood e estilo — e injeta isso em todo conteúdo que ela gerar pra você.
        </p>
      </div>

      {erro && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{erro}</span>
          <button onClick={() => setErro(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {sucesso && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-emerald-950/30 border border-emerald-700/40 text-emerald-300 text-xs">
          <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{sucesso}</span>
        </div>
      )}

      {kit ? (
        <BrandKitView kit={kit} onRegenerar={() => setKit(null)} onDeletar={deletar} />
      ) : (
        <UploadView
          referencias={referenciasSelecionadas}
          enviando={enviando}
          extraindo={extraindo}
          onUpload={handleUpload}
          onRemover={(url) => setReferenciasSelecionadas((prev) => prev.filter((u) => u !== url))}
          onExtrair={extrair}
        />
      )}
    </div>
  )
}

function UploadView({
  referencias, enviando, extraindo, onUpload, onRemover, onExtrair,
}: {
  referencias: string[]
  enviando: boolean
  extraindo: boolean
  onUpload: (files: FileList | null) => void
  onRemover: (url: string) => void
  onExtrair: () => void
}) {
  return (
    <div className="iara-card p-6 sm:p-8">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        {referencias.map((url) => (
          <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-[#2a2a4a] group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => onRemover(url)}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}
        {referencias.length < 5 && (
          <label className="aspect-square rounded-xl border-2 border-dashed border-iara-700/40 hover:border-iara-500/60 hover:bg-iara-900/20 flex flex-col items-center justify-center cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onUpload(e.target.files)}
              disabled={enviando}
            />
            {enviando ? (
              <Loader2 className="w-6 h-6 text-iara-400 animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-iara-400 mb-1" />
                <span className="text-xs text-iara-400/70">Adicionar</span>
              </>
            )}
          </label>
        )}
      </div>

      <p className="text-xs text-[#5a5a7a] mb-5">
        {referencias.length === 0
          ? 'Sobe pelo menos 1 imagem (até 5).'
          : `${referencias.length}/5 referências adicionadas.`}
      </p>

      <button
        onClick={onExtrair}
        disabled={referencias.length === 0 || extraindo}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-iara-500 to-accent-purple text-white text-sm font-bold disabled:opacity-50 transition shadow-lg"
      >
        {extraindo ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Iara analisando seu visual…</>
        ) : (
          <><Sparkles className="w-4 h-4" /> Gerar meu Brand Kit</>
        )}
      </button>

      <p className="text-[10px] text-iara-300/50 mt-3 text-center">
        IA Vision analisa as imagens e extrai paleta, fontes, mood. Leva 30-60s.
      </p>
    </div>
  )
}

function BrandKitView({
  kit, onRegenerar, onDeletar,
}: {
  kit: BrandKit
  onRegenerar: () => void
  onDeletar: () => void
}) {
  return (
    <div className="space-y-5">
      <div className="iara-card p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-sm font-bold text-iara-300 uppercase tracking-wider">Sua identidade visual</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onRegenerar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-iara-900/30 border border-iara-700/30 text-iara-300 text-xs hover:bg-iara-900/50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Regenerar
            </button>
            <button
              onClick={onDeletar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/30 border border-red-800/30 text-red-400 text-xs hover:bg-red-950/50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Paleta */}
        {Array.isArray(kit.paleta_principal) && kit.paleta_principal.length > 0 && (
          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-widest text-[#6b6b8a] mb-2">Paleta</p>
            <div className="flex flex-wrap gap-2">
              {kit.paleta_principal.map((cor, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#0a0a14]/60 rounded-xl pl-2 pr-3 py-1.5 border border-[#1a1a2e]">
                  <div
                    className="w-6 h-6 rounded-md border border-white/10 flex-shrink-0"
                    style={{ backgroundColor: cor.hex }}
                  />
                  <div className="text-xs">
                    <p className="font-mono text-[#d4d4e8]">{cor.hex}</p>
                    <p className="text-[10px] text-[#6b6b8a]">{cor.uso}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tipografia + Mood */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {kit.fonte_titulo && (
            <Bloco titulo="Fonte títulos" valor={kit.fonte_titulo} />
          )}
          {kit.fonte_corpo && (
            <Bloco titulo="Fonte corpo" valor={kit.fonte_corpo} />
          )}
          {kit.mood_visual && (
            <Bloco titulo="Mood" valor={kit.mood_visual} />
          )}
          {kit.estilo_imagens && (
            <Bloco titulo="Estilo imagens" valor={kit.estilo_imagens} />
          )}
        </div>

        {/* Elementos recorrentes */}
        {Array.isArray(kit.elementos_recorrentes) && kit.elementos_recorrentes.length > 0 && (
          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-widest text-[#6b6b8a] mb-2">Elementos recorrentes</p>
            <div className="flex flex-wrap gap-1.5">
              {kit.elementos_recorrentes.map((el, i) => (
                <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-iara-900/40 border border-iara-700/30 text-iara-300">
                  {el}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Raciocínio IA */}
        {kit.raciocinio_ia && (
          <details className="border-t border-[#1a1a2e] pt-4">
            <summary className="cursor-pointer text-[11px] uppercase tracking-widest text-[#6b6b8a] hover:text-iara-400 select-none">
              Por que a Iara escolheu isso
            </summary>
            <p className="text-xs text-[#9b9bb5] leading-relaxed mt-2">{kit.raciocinio_ia}</p>
          </details>
        )}
      </div>

      {/* Refs originais */}
      {Array.isArray(kit.referencias_urls) && kit.referencias_urls.length > 0 && (
        <div className="iara-card p-5">
          <p className="text-[10px] uppercase tracking-widest text-[#6b6b8a] mb-3">
            Referências usadas ({kit.referencias_urls.length})
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {kit.referencias_urls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" className="aspect-square object-cover rounded-lg border border-[#1a1a2e]" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Bloco({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="bg-[#0a0a14]/60 rounded-xl p-3 border border-[#1a1a2e]">
      <p className="text-[10px] uppercase tracking-widest text-[#6b6b8a] mb-1">{titulo}</p>
      <p className="text-sm text-[#d4d4e8]">{valor}</p>
    </div>
  )
}
