'use client'

import { useEffect, useState } from 'react'
import {
  X, Type, Image as ImageIcon, Layers, Palette,
  AlignCenter, AlignLeft, AlignRight, ArrowUp, ArrowDown,
  Sun, Check, Sparkles, Layout,
} from 'lucide-react'
import type { Slide } from '@/app/api/carrossel/gerar/route'

type Props = {
  slide: Slide
  imagensPreview: string[]
  total: number
  modo: 'criador' | 'marca'
  onChange: (slide: Slide) => void
  onClose: () => void
}

type Secao = 'conteudo' | 'visual' | 'foto'

const ARQUETIPOS_CRIADOR = [
  { id: 'cover_full',   label: 'Foto cheia',      dica: 'Foto preenche tudo, texto na base',       usaFoto: true },
  { id: 'split_v',      label: 'Lado a lado',     dica: 'Texto à esquerda, foto à direita',        usaFoto: true },
  { id: 'top_text',     label: 'Texto em cima',   dica: 'Texto no topo, foto embaixo',             usaFoto: true },
  { id: 'full_bleed',   label: 'Foco na foto',    dica: 'Foto preenche, texto pequeno na base',    usaFoto: true },
  { id: 'quote',        label: 'Citação',         dica: 'Frase em destaque, overlay escuro',       usaFoto: true },
  { id: 'editorial',    label: 'Editorial',       dica: 'Painel branco + foto, estilo revista',    usaFoto: true },
  { id: 'cinematic',    label: 'Cinema',          dica: 'Barras pretas em cima e embaixo',         usaFoto: true },
  { id: 'caption_bar',  label: 'Feed',            dica: 'Foto em cima, texto numa barra embaixo',  usaFoto: true },
  { id: 'inset_photo',  label: 'Card',            dica: 'Foto emoldurada, texto embaixo',          usaFoto: true },
  { id: 'warm_overlay', label: 'Lifestyle',       dica: 'Tom âmbar quente, clima humano',          usaFoto: true },
  { id: 'bold_type',    label: 'Tipografia',      dica: 'Texto enorme, foto como textura',         usaFoto: true },
  { id: 'side_right',   label: 'Foto à esquerda', dica: 'Foto à esquerda, texto à direita',        usaFoto: true },
  { id: 'neon_card',    label: 'Neon',            dica: 'Card centralizado com borda luminosa',    usaFoto: true },
  { id: 'closing',      label: 'Encerramento',    dica: 'Sem foto, CTA central e assinatura',      usaFoto: false },
] as const

const ARQUETIPOS_MARCA = [
  { id: 'brand_cover',  label: 'Capa',            dica: 'Capa da marca com foto full-bleed',       usaFoto: true },
  { id: 'brand_story',  label: 'História',        dica: 'Foto de fundo, texto à esquerda',         usaFoto: true },
  { id: 'brand_promo',  label: 'Promo',           dica: 'Gradiente, título, CTA com botão',        usaFoto: false },
] as const

const FOCOS = [
  { id: 'topo',     label: 'Topo',    icon: ArrowUp },
  { id: 'centro',   label: 'Centro',  icon: AlignCenter },
  { id: 'base',     label: 'Base',    icon: ArrowDown },
  { id: 'esquerda', label: 'Esquerda', icon: AlignLeft },
  { id: 'direita',  label: 'Direita', icon: AlignRight },
] as const

const CORES_TEXTO = [
  { label: 'Branco',    hex: '#ffffff' },
  { label: 'Preto',     hex: '#0a0a0a' },
  { label: 'Dourado',   hex: '#fbbf24' },
  { label: 'Violeta',   hex: '#a855f7' },
  { label: 'Rosa',      hex: '#ec4899' },
  { label: 'Verde',     hex: '#10b981' },
]

export function SlideEditorInline({ slide, imagensPreview, total, modo, onChange, onClose }: Props) {
  const [secao, setSecao] = useState<Secao>('conteudo')
  const arquetipos = modo === 'marca' ? ARQUETIPOS_MARCA : ARQUETIPOS_CRIADOR

  // Estado local para inputs (evita lag ao digitar)
  const [local, setLocal] = useState<Slide>(slide)

  useEffect(() => { setLocal(slide) }, [slide.ordem])

  function commit(novo: Partial<Slide>) {
    const merged = { ...local, ...novo }
    setLocal(merged)
    onChange(merged)
  }

  // Para inputs de texto: atualiza local imediatamente, commita com debounce
  useEffect(() => {
    const t = setTimeout(() => {
      if (
        local.titulo !== slide.titulo ||
        local.corpo !== slide.corpo ||
        local.eyebrow !== slide.eyebrow ||
        local.cta !== slide.cta ||
        local.handle !== slide.handle
      ) {
        onChange(local)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [local.titulo, local.corpo, local.eyebrow, local.cta, local.handle])

  const overlayOp = local.overlay_opacity ?? 1

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Painel */}
      <div className="relative w-full sm:w-[420px] h-[88vh] sm:h-[calc(100vh-24px)] sm:mr-3 bg-[#0a0a14] sm:rounded-2xl border-t sm:border border-[#1a1a2e] shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a2e] flex-shrink-0">
          <div>
            <p className="text-xs text-iara-400 font-medium">Editando</p>
            <p className="text-sm font-semibold text-[#f1f1f8]">Slide {slide.ordem} <span className="text-[#5a5a7a] font-normal">de {total}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#1a1a2e] text-[#6b6b8a] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1a1a2e] flex-shrink-0">
          {[
            { id: 'conteudo' as const, label: 'Texto',  icon: Type },
            { id: 'visual' as const,   label: 'Visual', icon: Layers },
            { id: 'foto' as const,     label: 'Foto',   icon: ImageIcon },
          ].map(t => {
            const Icon = t.icon
            const ativo = secao === t.id
            return (
              <button
                key={t.id}
                onClick={() => setSecao(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${
                  ativo ? 'text-iara-300 border-b-2 border-iara-500 -mb-px' : 'text-[#6b6b8a] hover:text-[#9b9bb5]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Scroll area */}
        <div className="flex-1 overflow-y-auto">

          {/* ═══ SEÇÃO CONTEÚDO ═══ */}
          {secao === 'conteudo' && (
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#8a8aaa] uppercase tracking-wide mb-1.5">Olho (texto pequeno acima)</label>
                <input
                  value={local.eyebrow ?? ''}
                  onChange={e => setLocal({ ...local, eyebrow: e.target.value })}
                  placeholder="ex: dica 02 · marketing"
                  className="w-full bg-[#12121e] border border-[#1f1f2e] rounded-lg px-3 py-2 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-iara-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8a8aaa] uppercase tracking-wide mb-1.5">Título</label>
                <textarea
                  value={local.titulo ?? ''}
                  onChange={e => setLocal({ ...local, titulo: e.target.value })}
                  placeholder="Frase de impacto"
                  rows={2}
                  className="w-full bg-[#12121e] border border-[#1f1f2e] rounded-lg px-3 py-2 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-iara-500 resize-none"
                />
                <p className="text-[10px] text-[#4a4a6a] text-right mt-1">{(local.titulo ?? '').length} caracteres</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8a8aaa] uppercase tracking-wide mb-1.5">Corpo</label>
                <textarea
                  value={local.corpo ?? ''}
                  onChange={e => setLocal({ ...local, corpo: e.target.value })}
                  placeholder="Explicação, detalhe, exemplo..."
                  rows={4}
                  className="w-full bg-[#12121e] border border-[#1f1f2e] rounded-lg px-3 py-2 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-iara-500 resize-none"
                />
                <p className="text-[10px] text-[#4a4a6a] text-right mt-1">{(local.corpo ?? '').length} caracteres</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8a8aaa] uppercase tracking-wide mb-1.5">Chamada (CTA)</label>
                <input
                  value={local.cta ?? ''}
                  onChange={e => setLocal({ ...local, cta: e.target.value })}
                  placeholder="ex: Salva esse post!"
                  className="w-full bg-[#12121e] border border-[#1f1f2e] rounded-lg px-3 py-2 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-iara-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8a8aaa] uppercase tracking-wide mb-1.5">Seu @</label>
                <input
                  value={local.handle ?? ''}
                  onChange={e => setLocal({ ...local, handle: e.target.value })}
                  placeholder="@seunome"
                  className="w-full bg-[#12121e] border border-[#1f1f2e] rounded-lg px-3 py-2 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-iara-500"
                />
              </div>
            </div>
          )}

          {/* ═══ SEÇÃO VISUAL ═══ */}
          {secao === 'visual' && (
            <div className="p-5 space-y-5">
              {/* Arquétipo */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Layout className="w-3.5 h-3.5 text-[#8a8aaa]" />
                  <label className="text-[11px] font-semibold text-[#8a8aaa] uppercase tracking-wide">Layout</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {arquetipos.map(a => {
                    const ativo = (local.arquetipo ?? '') === a.id
                    return (
                      <button
                        key={a.id}
                        onClick={() => commit({ arquetipo: a.id })}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          ativo
                            ? 'border-iara-500 bg-iara-600/15 text-iara-200'
                            : 'border-[#1f1f2e] bg-[#12121e] text-[#9b9bb5] hover:border-iara-700/40 hover:bg-[#14142a]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs font-semibold">{a.label}</p>
                          {ativo && <Check className="w-3 h-3 text-iara-300" />}
                        </div>
                        <p className="text-[10px] text-[#5a5a7a] leading-tight">{a.dica}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Cor do texto */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Palette className="w-3.5 h-3.5 text-[#8a8aaa]" />
                  <label className="text-[11px] font-semibold text-[#8a8aaa] uppercase tracking-wide">Cor do texto</label>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  <button
                    onClick={() => commit({ cor_texto_override: undefined })}
                    className={`aspect-square rounded-lg border-2 text-[9px] font-medium transition-all flex items-center justify-center ${
                      !local.cor_texto_override
                        ? 'border-iara-500 text-iara-300 bg-iara-600/10'
                        : 'border-[#1f1f2e] text-[#6b6b8a] hover:border-iara-700/40'
                    }`}
                    title="Padrão do layout"
                  >
                    auto
                  </button>
                  {CORES_TEXTO.map(c => {
                    const ativo = local.cor_texto_override === c.hex
                    return (
                      <button
                        key={c.hex}
                        onClick={() => commit({ cor_texto_override: c.hex })}
                        className={`aspect-square rounded-lg border-2 transition-all relative ${
                          ativo ? 'border-iara-500 ring-2 ring-iara-500/30' : 'border-[#1f1f2e] hover:border-iara-700/40'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                      >
                        {ativo && (
                          <Check className="w-3.5 h-3.5 absolute inset-0 m-auto" style={{ color: c.hex === '#ffffff' ? '#000' : '#fff' }} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tamanho do título */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-[#8a8aaa]" />
                    <label className="text-[11px] font-semibold text-[#8a8aaa] uppercase tracking-wide">Tamanho do título</label>
                  </div>
                  <button
                    onClick={() => commit({ fs_titulo_override: undefined })}
                    className="text-[10px] text-[#6b6b8a] hover:text-iara-400 transition-colors"
                  >
                    automático
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={40}
                    max={160}
                    step={4}
                    value={local.fs_titulo_override ?? 96}
                    onChange={e => commit({ fs_titulo_override: Number(e.target.value) })}
                    className="flex-1 accent-iara-500"
                  />
                  <span className="text-xs font-mono text-[#9b9bb5] w-12 text-right">
                    {local.fs_titulo_override ?? 'auto'}
                    {local.fs_titulo_override && 'px'}
                  </span>
                </div>
              </div>

              {/* Opacidade do overlay */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-[#8a8aaa]" />
                    <label className="text-[11px] font-semibold text-[#8a8aaa] uppercase tracking-wide">Escuridão sobre a foto</label>
                  </div>
                  <button
                    onClick={() => commit({ overlay_opacity: undefined })}
                    className="text-[10px] text-[#6b6b8a] hover:text-iara-400 transition-colors"
                  >
                    padrão
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={1.2}
                    step={0.05}
                    value={overlayOp}
                    onChange={e => commit({ overlay_opacity: Number(e.target.value) })}
                    className="flex-1 accent-iara-500"
                  />
                  <span className="text-xs font-mono text-[#9b9bb5] w-12 text-right">
                    {Math.round(overlayOp * 100)}%
                  </span>
                </div>
                <p className="text-[10px] text-[#5a5a7a] mt-1">0% = foto totalmente visível · 100% = padrão do layout · 120% = mais escuro</p>
              </div>
            </div>
          )}

          {/* ═══ SEÇÃO FOTO ═══ */}
          {secao === 'foto' && (
            <div className="p-5 space-y-5">
              {imagensPreview.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="w-8 h-8 text-[#3a3a5a] mx-auto mb-2" />
                  <p className="text-xs text-[#6b6b8a]">Nenhuma foto carregada neste carrossel.</p>
                  <p className="text-[10px] text-[#4a4a6a] mt-1">Volte ao passo de imagens para adicionar.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#8a8aaa] uppercase tracking-wide mb-2">Foto deste slide</label>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => commit({ imagem_index: undefined })}
                        className={`aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                          local.imagem_index === undefined
                            ? 'border-iara-500 bg-iara-600/15 text-iara-300'
                            : 'border-[#1f1f2e] bg-[#12121e] text-[#6b6b8a] hover:border-iara-700/40'
                        }`}
                        title="Sem foto"
                      >
                        <X className="w-4 h-4" />
                        <span className="text-[9px] font-medium">nenhuma</span>
                      </button>
                      {imagensPreview.map((src, i) => {
                        const ativo = local.imagem_index === i
                        return (
                          <button
                            key={i}
                            onClick={() => commit({ imagem_index: i })}
                            className={`aspect-square rounded-lg border-2 overflow-hidden transition-all relative ${
                              ativo ? 'border-iara-500 ring-2 ring-iara-500/30' : 'border-[#1f1f2e] hover:border-iara-700/40'
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center text-[9px] text-white font-bold">
                              {i + 1}
                            </div>
                            {ativo && (
                              <div className="absolute inset-0 bg-iara-600/30 flex items-center justify-center">
                                <div className="w-6 h-6 rounded-full bg-iara-500 flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5 text-white" />
                                </div>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {local.imagem_index !== undefined && (
                    <div>
                      <label className="block text-[11px] font-semibold text-[#8a8aaa] uppercase tracking-wide mb-2">Foco da foto</label>
                      <p className="text-[10px] text-[#5a5a7a] mb-2">Qual parte da foto fica centralizada quando o layout não mostra tudo.</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        <button
                          onClick={() => commit({ foto_foco: undefined })}
                          className={`py-2 rounded-lg border text-[10px] font-medium transition-all ${
                            !local.foto_foco
                              ? 'border-iara-500 bg-iara-600/15 text-iara-300'
                              : 'border-[#1f1f2e] bg-[#12121e] text-[#6b6b8a] hover:border-iara-700/40'
                          }`}
                        >
                          auto
                        </button>
                        {FOCOS.map(f => {
                          const Icon = f.icon
                          const ativo = local.foto_foco === f.id
                          return (
                            <button
                              key={f.id}
                              onClick={() => commit({ foto_foco: f.id })}
                              className={`py-2 rounded-lg border flex flex-col items-center gap-0.5 transition-all ${
                                ativo
                                  ? 'border-iara-500 bg-iara-600/15 text-iara-300'
                                  : 'border-[#1f1f2e] bg-[#12121e] text-[#6b6b8a] hover:border-iara-700/40'
                              }`}
                              title={f.label}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span className="text-[9px]">{f.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>

        {/* Footer — dica */}
        <div className="px-5 py-3 border-t border-[#1a1a2e] flex items-center gap-2 text-[10px] text-[#5a5a7a] flex-shrink-0">
          <Sparkles className="w-3 h-3 text-iara-500" />
          Mudanças aplicam em tempo real — sem gastar créditos
        </div>
      </div>
    </div>
  )
}
