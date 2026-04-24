'use client'

import { useState } from 'react'
import {
  X, Check, Type, Palette, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, Maximize2,
} from 'lucide-react'
import type { Slide } from '@/app/api/carrossel/gerar/route'

// ─── Paleta de 50+ cores ────────────────────────────────────────────────────
const CORES_FUNDO: { nome: string; hex: string }[] = [
  { nome: 'Preto',        hex: '#08080f' },
  { nome: 'Grafite',      hex: '#1a1a2e' },
  { nome: 'Chumbo',       hex: '#2a2a3e' },
  { nome: 'Branco',       hex: '#ffffff' },
  { nome: 'Creme',        hex: '#f8f5f0' },
  { nome: 'Bege',         hex: '#e8e0d5' },
  { nome: 'Areia',        hex: '#d4c9b8' },
  { nome: 'Ouro',         hex: '#e2c068' },
  { nome: 'Dourado',      hex: '#c9a84c' },
  { nome: 'Âmbar',        hex: '#f59e0b' },
  { nome: 'Laranja',      hex: '#fb923c' },
  { nome: 'Laranja neon', hex: '#ff6b00' },
  { nome: 'Coral',        hex: '#fb7185' },
  { nome: 'Rosa',         hex: '#ec4899' },
  { nome: 'Rosa claro',   hex: '#f9a8d4' },
  { nome: 'Magenta',      hex: '#d946ef' },
  { nome: 'Roxo',         hex: '#a855f7' },
  { nome: 'Roxo escuro',  hex: '#7e22ce' },
  { nome: 'Índigo',       hex: '#6366f1' },
  { nome: 'Azul',         hex: '#3b82f6' },
  { nome: 'Azul royal',   hex: '#2563eb' },
  { nome: 'Azul marinho', hex: '#1e3a8a' },
  { nome: 'Ciano',        hex: '#06b6d4' },
  { nome: 'Turquesa',     hex: '#14b8a6' },
  { nome: 'Verde água',   hex: '#10b981' },
  { nome: 'Verde',        hex: '#22c55e' },
  { nome: 'Verde oliva',  hex: '#65a30d' },
  { nome: 'Verde neon',   hex: '#4ade80' },
  { nome: 'Limão',        hex: '#bef264' },
  { nome: 'Amarelo',      hex: '#fbbf24' },
  { nome: 'Mostarda',     hex: '#ca8a04' },
  { nome: 'Terracota',    hex: '#a34f3c' },
  { nome: 'Marrom',       hex: '#78350f' },
  { nome: 'Chocolate',    hex: '#4a2617' },
  { nome: 'Vinho',        hex: '#7f1d1d' },
  { nome: 'Vermelho',     hex: '#ef4444' },
  { nome: 'Sangue',       hex: '#dc2626' },
  { nome: 'Salmão',       hex: '#f87171' },
  { nome: 'Pêssego',      hex: '#fdba74' },
  { nome: 'Lavanda',      hex: '#c4b5fd' },
  { nome: 'Lilás',        hex: '#ddd6fe' },
  { nome: 'Azul bebê',    hex: '#bfdbfe' },
  { nome: 'Menta',        hex: '#a7f3d0' },
  { nome: 'Verde pastel', hex: '#bbf7d0' },
  { nome: 'Rosa pastel',  hex: '#fbcfe8' },
  { nome: 'Cinza claro',  hex: '#e5e7eb' },
  { nome: 'Cinza',        hex: '#9ca3af' },
  { nome: 'Cinza escuro', hex: '#4b5563' },
  { nome: 'Azul meia',    hex: '#475569' },
  { nome: 'Oliva escuro', hex: '#3f3f1f' },
]

const CORES_TEXTO = [
  '#ffffff', '#f1f1f8', '#c1c1d8', '#9b9bb5', '#6b6b8a', '#4a4a6a',
  '#000000', '#1a1a2e', '#e2c068', '#c9a84c', '#ec4899', '#a855f7',
  '#6366f1', '#06b6d4', '#10b981', '#22c55e', '#f59e0b', '#ef4444',
]

const ARQUETIPOS_VISUAIS: { id: string; label: string; desc: string; temFoto: boolean }[] = [
  { id: 'cover_full',     label: 'Foto cheia',     desc: 'Foto preenche tudo', temFoto: true },
  { id: 'split_v',        label: 'Lado a lado',    desc: 'Texto esq + foto dir', temFoto: true },
  { id: 'side_right',     label: 'Lado invertido', desc: 'Foto esq + texto dir', temFoto: true },
  { id: 'caption_bar',    label: 'Legenda',        desc: 'Foto 65% + barra texto', temFoto: true },
  { id: 'editorial',      label: 'Editorial',      desc: 'Painel branco + foto', temFoto: true },
  { id: 'cinematic',      label: 'Cinema',         desc: 'Estilo letterbox', temFoto: true },
  { id: 'photo_top_full', label: 'Foto grande',    desc: 'Foto 75% + texto', temFoto: true },
  { id: 'inset_photo',    label: 'Moldura',        desc: 'Foto com margens', temFoto: true },
  { id: 'magazine_full',  label: 'Revista',        desc: 'Card sobre foto', temFoto: true },
  { id: 'photo_frame',    label: 'Polaroid',       desc: 'Estilo foto antiga', temFoto: true },
  { id: 'full_bleed',     label: 'Bleed total',    desc: 'Foto + overlay + texto', temFoto: true },
  { id: 'warm_overlay',   label: 'Overlay quente', desc: 'Âmbar sobre foto', temFoto: true },
  { id: 'duo_panel',      label: 'Duo painel',     desc: 'Dois blocos', temFoto: true },
  { id: 'story_arc',      label: 'Arco',           desc: 'Narrativa visual', temFoto: true },
  { id: 'dark_split',     label: 'Split dark',     desc: 'Foto + bloco escuro', temFoto: true },
  // Sem foto
  { id: 'quote',          label: 'Citação',        desc: 'Frase em destaque', temFoto: false },
  { id: 'highlight_box',  label: 'Destaque',       desc: 'Número/dado em foco', temFoto: false },
  { id: 'list_card',      label: 'Lista',          desc: 'Itens numerados', temFoto: false },
  { id: 'minimal_text',   label: 'Mínimo',         desc: 'Só tipografia', temFoto: false },
  { id: 'gradient_text',  label: 'Gradiente',      desc: 'Texto colorido', temFoto: false },
  { id: 'color_block',    label: 'Bloco cor',      desc: 'Tipografia sobre cor', temFoto: false },
  { id: 'closing',        label: 'Encerramento',   desc: 'CTA + gradiente', temFoto: false },
]

type Props = {
  slide: Slide
  setSlide: (s: Slide) => void
  onFechar: () => void
  onAplicar: () => void
  temFoto: boolean              // se o carrossel tem imagens
}

export function CarrosselEditorSlide({ slide, setSlide, onFechar, onAplicar, temFoto }: Props) {
  const [tab, setTab] = useState<'texto' | 'estilo' | 'foto'>('texto')
  const temFotoNoSlide = temFoto && slide.imagem_index !== undefined

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onFechar}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl bg-[#0d0d1a] border border-[#1a1a2e] rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a2e]">
          <div>
            <p className="text-sm font-semibold text-[#f1f1f8]">Editar slide {slide.ordem}</p>
            <p className="text-xs text-[#5a5a7a] mt-0.5">Ajuste texto, cores, fonte e foto — sem gastar créditos</p>
          </div>
          <button onClick={onFechar} className="p-1.5 rounded-lg hover:bg-[#1a1a2e] text-[#6b6b8a] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1a1a2e] px-5">
          {([
            { id: 'texto',  label: 'Texto',  icon: Type },
            { id: 'estilo', label: 'Estilo', icon: Palette },
            { id: 'foto',   label: 'Foto',   icon: ImageIcon },
          ] as const).map(t => {
            const Icon = t.icon
            const ativo = tab === t.id
            const disabled = t.id === 'foto' && !temFotoNoSlide
            return (
              <button
                key={t.id}
                onClick={() => !disabled && setTab(t.id)}
                disabled={disabled}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                  ativo
                    ? 'border-iara-500 text-iara-300'
                    : disabled
                    ? 'border-transparent text-[#3a3a5a] cursor-not-allowed'
                    : 'border-transparent text-[#6b6b8a] hover:text-[#9b9bb5]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">

          {/* ─── TAB: TEXTO ─── */}
          {tab === 'texto' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#c1c1d8] mb-1.5">
                  Eyebrow <span className="text-[#4a4a6a] font-normal">(texto pequeno acima do título)</span>
                </label>
                <input
                  value={slide.eyebrow ?? ''}
                  onChange={e => setSlide({ ...slide, eyebrow: e.target.value })}
                  placeholder="Ex: dica 03 · marketing"
                  className="w-full bg-[#08080f] border border-[#1a1a2e] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-iara-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c1c1d8] mb-1.5">Título principal</label>
                <input
                  value={slide.titulo ?? ''}
                  onChange={e => setSlide({ ...slide, titulo: e.target.value })}
                  placeholder="Ex: 3 hábitos que mudaram minha vida"
                  className="w-full bg-[#08080f] border border-[#1a1a2e] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-iara-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c1c1d8] mb-1.5">Texto do slide</label>
                <textarea
                  value={slide.corpo}
                  onChange={e => setSlide({ ...slide, corpo: e.target.value })}
                  rows={4}
                  placeholder="Ex: Acordar cedo, ler 10 minutos e tomar água antes do café..."
                  className="w-full bg-[#08080f] border border-[#1a1a2e] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-iara-500 resize-none"
                />
                <p className="text-[10px] text-[#5a5a7a] mt-1">{slide.corpo.length} caracteres</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c1c1d8] mb-1.5">
                  Chamada para ação <span className="text-[#4a4a6a] font-normal">(opcional)</span>
                </label>
                <input
                  value={slide.cta ?? ''}
                  onChange={e => setSlide({ ...slide, cta: e.target.value })}
                  placeholder="Ex: Salva esse post!"
                  className="w-full bg-[#08080f] border border-[#1a1a2e] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-iara-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c1c1d8] mb-1.5">
                  Seu @ nas redes <span className="text-[#4a4a6a] font-normal">(rodapé)</span>
                </label>
                <input
                  value={slide.handle ?? ''}
                  onChange={e => setSlide({ ...slide, handle: e.target.value })}
                  placeholder="Ex: @seunome"
                  className="w-full bg-[#08080f] border border-[#1a1a2e] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-iara-500"
                />
              </div>
            </>
          )}

          {/* ─── TAB: ESTILO ─── */}
          {tab === 'estilo' && (
            <>
              {/* Fonte */}
              <div>
                <label className="block text-xs font-medium text-[#c1c1d8] mb-2">Fonte do slide</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'inter',    label: 'Moderna',   fontCss: 'Inter, sans-serif' },
                    { id: 'oswald',   label: 'Impacto',   fontCss: 'Oswald, sans-serif' },
                    { id: 'playfair', label: 'Editorial', fontCss: '"Playfair Display", serif' },
                  ] as const).map(f => {
                    const ativo = (slide.fonte_override ?? 'inter') === f.id
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSlide({ ...slide, fonte_override: f.id })}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          ativo
                            ? 'border-iara-500 bg-iara-600/20 text-iara-200'
                            : 'border-[#1a1a2e] bg-[#08080f] text-[#9b9bb5] hover:border-iara-700/40'
                        }`}
                      >
                        <p className="text-[11px] font-semibold" style={{ fontFamily: f.fontCss }}>{f.label}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Alinhamento */}
              <div>
                <label className="block text-xs font-medium text-[#c1c1d8] mb-2">Alinhamento</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'left',   label: 'Esq',     Icon: AlignLeft },
                    { id: 'center', label: 'Centro',  Icon: AlignCenter },
                    { id: 'right',  label: 'Dir',     Icon: AlignRight },
                  ] as const).map(a => {
                    const ativo = (slide.alinhamento ?? 'left') === a.id
                    return (
                      <button
                        key={a.id}
                        onClick={() => setSlide({ ...slide, alinhamento: a.id })}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all ${
                          ativo
                            ? 'border-iara-500 bg-iara-600/20 text-iara-200'
                            : 'border-[#1a1a2e] bg-[#08080f] text-[#9b9bb5] hover:border-iara-700/40'
                        }`}
                      >
                        <a.Icon className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-semibold">{a.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tamanho */}
              <div>
                <label className="block text-xs font-medium text-[#c1c1d8] mb-2">Tamanho da fonte</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['pequeno', 'medio', 'grande', 'gigante'] as const).map(t => {
                    const ativo = slide.tamanho_fonte === t
                    return (
                      <button
                        key={t}
                        onClick={() => setSlide({ ...slide, tamanho_fonte: t })}
                        className={`py-2 rounded-xl border text-[11px] font-semibold transition-all capitalize ${
                          ativo
                            ? 'border-iara-500 bg-iara-600/20 text-iara-200'
                            : 'border-[#1a1a2e] bg-[#08080f] text-[#9b9bb5] hover:border-iara-700/40'
                        }`}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Cor do texto */}
              <div>
                <label className="block text-xs font-medium text-[#c1c1d8] mb-2">Cor do texto</label>
                <div className="flex flex-wrap gap-1.5">
                  {CORES_TEXTO.map(c => {
                    const ativo = slide.cor_texto_override === c
                    return (
                      <button
                        key={c}
                        onClick={() => setSlide({ ...slide, cor_texto_override: ativo ? undefined : c })}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          ativo ? 'border-white scale-110' : 'border-[#1a1a2e]'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    )
                  })}
                  <label className="w-8 h-8 rounded-lg border-2 border-dashed border-[#2a2a4a] cursor-pointer overflow-hidden relative hover:border-white" title="Custom">
                    <input
                      type="color"
                      value={slide.cor_texto_override ?? '#ffffff'}
                      onChange={e => setSlide({ ...slide, cor_texto_override: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <span className="flex items-center justify-center h-full text-[10px] text-[#6b6b8a]">+</span>
                  </label>
                </div>
                <p className="text-[10px] text-[#5a5a7a] mt-1.5">Funciona nos arquétipos Foto Cheia, Lado a Lado e Texto no Topo. Expandindo para os demais na próxima versão.</p>
              </div>

              {/* Cor do fundo — paleta 50 cores */}
              <div>
                <label className="block text-xs font-medium text-[#c1c1d8] mb-2">
                  Cor do fundo <span className="text-[#4a4a6a] font-normal">(sobre a foto — ou fundo total se arquétipo sem foto)</span>
                </label>
                <div className="grid grid-cols-10 gap-1">
                  {CORES_FUNDO.map(c => {
                    const ativo = slide.cor_fundo_override === c.hex
                    return (
                      <button
                        key={c.hex}
                        onClick={() => setSlide({ ...slide, cor_fundo_override: ativo ? undefined : c.hex })}
                        className={`aspect-square rounded-md border transition-all ${
                          ativo ? 'border-white ring-2 ring-iara-500 scale-110' : 'border-[#1a1a2e]'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.nome}
                      />
                    )
                  })}
                </div>
                {slide.cor_fundo_override && (
                  <button
                    onClick={() => setSlide({ ...slide, cor_fundo_override: undefined })}
                    className="mt-1.5 text-[10px] text-[#6b6b8a] hover:text-[#9b9bb5] underline"
                  >
                    Remover cor de fundo
                  </button>
                )}
              </div>

              {/* Arquétipo */}
              <div>
                <label className="block text-xs font-medium text-[#c1c1d8] mb-2">Layout do slide</label>
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                  {ARQUETIPOS_VISUAIS.map(op => {
                    const ativo = (slide.arquetipo ?? '') === op.id
                    const desabilitado = op.temFoto && !temFotoNoSlide
                    return (
                      <button
                        key={op.id}
                        onClick={() => !desabilitado && setSlide({ ...slide, arquetipo: op.id })}
                        disabled={desabilitado}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          ativo
                            ? 'border-iara-500 bg-iara-600/20 text-iara-200'
                            : desabilitado
                            ? 'border-[#1a1a2e] bg-[#08080f] text-[#3a3a5a] cursor-not-allowed opacity-50'
                            : 'border-[#1a1a2e] bg-[#08080f] text-[#9b9bb5] hover:border-iara-700/40'
                        }`}
                      >
                        <p className="text-[11px] font-semibold leading-tight">{op.label}</p>
                        <p className="text-[9px] text-[#5a5a7a] mt-0.5 leading-tight">{op.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* ─── TAB: FOTO ─── */}
          {tab === 'foto' && temFotoNoSlide && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#c1c1d8] mb-2">
                  Enquadramento da foto
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { id: 'center top',       label: 'Topo' },
                    { id: 'center center',    label: 'Centro' },
                    { id: 'center bottom',    label: 'Base' },
                    { id: 'left center',      label: 'Esq' },
                    { id: 'center',           label: 'Meio' },
                    { id: 'right center',     label: 'Dir' },
                    { id: 'left top',         label: 'Sup-esq' },
                    { id: 'center top',       label: 'Sup-cent' },
                    { id: 'right top',        label: 'Sup-dir' },
                  ] as const).map((p, i) => {
                    const ativo = slide.foto_object_position === p.id
                    return (
                      <button
                        key={`${p.id}-${i}`}
                        onClick={() => setSlide({ ...slide, foto_object_position: ativo ? undefined : p.id })}
                        className={`py-2 rounded-lg border text-[10px] font-semibold transition-all ${
                          ativo
                            ? 'border-iara-500 bg-iara-600/20 text-iara-200'
                            : 'border-[#1a1a2e] bg-[#08080f] text-[#9b9bb5] hover:border-iara-700/40'
                        }`}
                      >
                        {p.label}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] text-[#5a5a7a] mt-1.5">Escolhe qual parte da foto fica visível — útil pra não cortar rosto.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c1c1d8] mb-2 flex items-center gap-2">
                  <Maximize2 className="w-3 h-3" />
                  Zoom na foto: {((slide.foto_zoom ?? 1) * 100).toFixed(0)}%
                </label>
                <input
                  type="range" min={1} max={2} step={0.05}
                  value={slide.foto_zoom ?? 1}
                  onChange={e => setSlide({ ...slide, foto_zoom: Number(e.target.value) })}
                  className="w-full accent-iara-500"
                />
                <div className="flex justify-between text-[10px] text-[#5a5a7a] mt-0.5">
                  <span>Normal</span>
                  <span>+100%</span>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#1a1a2e] flex gap-2">
          <button
            onClick={onFechar}
            className="flex-1 py-2.5 rounded-xl border border-[#1a1a2e] text-sm text-[#9b9bb5] hover:border-[#2a2a3e] transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onAplicar}
            className="flex-1 py-2.5 rounded-xl bg-iara-600 hover:bg-iara-500 text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Aplicar mudanças
          </button>
        </div>
      </div>
    </div>
  )
}
