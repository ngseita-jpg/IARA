'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Type, Palette, Layout as LayoutIcon, Image as ImageIcon, Sparkles,
  Tag, Undo2, Redo2, RotateCcw, Save, Loader2, Check,
  AlignLeft, AlignCenter, AlignRight,
} from 'lucide-react'
import type { ThumbnailLayout } from '@/app/api/thumbnail/gerar/route'
import { toast } from '@/lib/toast'
import { FotoFundoDragger } from '@/components/foto-fundo-dragger'

type Aba = 'texto' | 'estilo' | 'layout' | 'fundo' | 'foto' | 'extras'

const ABAS: { id: Aba; label: string; icon: React.ElementType }[] = [
  { id: 'texto',  label: 'Texto',   icon: Type },
  { id: 'estilo', label: 'Estilo',  icon: Palette },
  { id: 'layout', label: 'Layout',  icon: LayoutIcon },
  { id: 'fundo',  label: 'Fundo',   icon: Sparkles },
  { id: 'foto',   label: 'Foto',    icon: ImageIcon },
  { id: 'extras', label: 'Extras',  icon: Tag },
]

// 17 fontes do gerador
const FONTES: { id: ThumbnailLayout['fonte']; label: string; family: string; weight?: number }[] = [
  { id: 'bebas',            label: 'Bebas',           family: "'Bebas Neue', sans-serif",      weight: 400 },
  { id: 'anton',            label: 'Anton',           family: "'Anton', sans-serif",            weight: 400 },
  { id: 'russo',            label: 'Russo',           family: "'Russo One', sans-serif",        weight: 400 },
  { id: 'oswald',           label: 'Oswald',          family: "'Oswald', sans-serif",           weight: 700 },
  { id: 'archivo_black',    label: 'Archivo Black',   family: "'Archivo Black', sans-serif",    weight: 400 },
  { id: 'montserrat_black', label: 'Montserrat',      family: "'Montserrat', sans-serif",       weight: 900 },
  { id: 'poppins_black',    label: 'Poppins',         family: "'Poppins', sans-serif",          weight: 900 },
  { id: 'space_grotesk',    label: 'Space Grotesk',   family: "'Space Grotesk', sans-serif",    weight: 700 },
  { id: 'syne',             label: 'Syne',            family: "'Syne', sans-serif",             weight: 800 },
  { id: 'inter',            label: 'Inter',           family: "'Inter', sans-serif",            weight: 900 },
  { id: 'playfair',         label: 'Playfair',        family: "'Playfair Display', serif",      weight: 900 },
  { id: 'playfair_italic',  label: 'Playfair Itálico',family: "'Playfair Display', serif",      weight: 900 },
  { id: 'cormorant_italic', label: 'Cormorant',       family: "'Cormorant', serif",             weight: 700 },
  { id: 'dm_serif',         label: 'DM Serif',        family: "'DM Serif Display', serif",      weight: 400 },
  { id: 'abril',            label: 'Abril',           family: "'Abril Fatface', serif",         weight: 400 },
  { id: 'dancing',          label: 'Dancing',         family: "'Dancing Script', cursive",      weight: 700 },
  { id: 'caveat',           label: 'Caveat',          family: "'Caveat', cursive",              weight: 700 },
]

// 9 posições de âncora pra texto
const ANCORAS: { id: ThumbnailLayout['texto_ancora']; row: 0|1|2; col: 0|1|2 }[] = [
  { id: 'topo_esq',    row: 0, col: 0 }, { id: 'topo_centro', row: 0, col: 1 }, { id: 'topo_dir', row: 0, col: 2 },
  { id: 'meio_esq',    row: 1, col: 0 }, { id: 'meio_centro', row: 1, col: 1 }, { id: 'meio_dir', row: 1, col: 2 },
  { id: 'base_esq',    row: 2, col: 0 }, { id: 'base_centro', row: 2, col: 1 }, { id: 'base_dir', row: 2, col: 2 },
]

// Zonas da foto
const ZONAS_FOTO: { id: ThumbnailLayout['foto_zona']; label: string }[] = [
  { id: 'nenhuma',      label: 'Sem foto' },
  { id: 'full',         label: 'Tela toda' },
  { id: 'esquerda_40',  label: 'Esq 40%' },
  { id: 'esquerda_50',  label: 'Esq 50%' },
  { id: 'esquerda_60',  label: 'Esq 60%' },
  { id: 'direita_40',   label: 'Dir 40%' },
  { id: 'direita_50',   label: 'Dir 50%' },
  { id: 'direita_60',   label: 'Dir 60%' },
  { id: 'topo_50',      label: 'Topo 50%' },
  { id: 'base_50',      label: 'Base 50%' },
]

const PALETA_PRIMARIA = ['#ffffff', '#000000', '#fbbf24', '#ec4899', '#a855f7', '#3b82f6', '#10b981', '#ef4444', '#f97316', '#06b6d4']

type Props = {
  layout: ThumbnailLayout
  layoutOriginal: ThumbnailLayout         // pra reset
  rerenderizando: boolean
  onChange: (novo: ThumbnailLayout) => void   // re-renderiza
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
  onDuplicar: () => void                  // salva como nova variação
  podeUndo: boolean
  podeRedo: boolean
  imagemBase64?: string | null            // pra preview do drag de foto
}

export function ThumbnailEditor({
  layout, layoutOriginal, rerenderizando,
  onChange, onUndo, onRedo, onReset, onDuplicar,
  podeUndo, podeRedo,
  imagemBase64,
}: Props) {
  const [aba, setAba] = useState<Aba>('texto')

  // Helper que faz update parcial (espalhamento + re-renderiza)
  const update = (patch: Partial<ThumbnailLayout>) => {
    onChange({ ...layout, ...patch })
  }

  return (
    <div className="rounded-2xl border border-iara-700/30 bg-[#0a0a14] overflow-hidden">
      {/* Header com ações globais */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1a1a2e] bg-[#0f0f1e]">
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!podeUndo || rerenderizando}
            aria-label="Desfazer"
            title="Desfazer (Ctrl+Z)"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#9b9bb5] hover:text-white hover:bg-[#1a1a2e] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!podeRedo || rerenderizando}
            aria-label="Refazer"
            title="Refazer (Ctrl+Shift+Z)"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#9b9bb5] hover:text-white hover:bg-[#1a1a2e] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-[#1a1a2e]" />

        <button
          onClick={onReset}
          disabled={rerenderizando}
          aria-label="Voltar ao original"
          title="Voltar ao layout que a IA gerou"
          className="flex items-center gap-1.5 px-2.5 h-9 rounded-lg text-xs text-[#9b9bb5] hover:text-amber-400 hover:bg-amber-950/20 disabled:opacity-30 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>

        <button
          onClick={onDuplicar}
          disabled={rerenderizando}
          aria-label="Salvar como nova variação"
          title="Duplica esse layout numa variação separada"
          className="flex items-center gap-1.5 px-2.5 h-9 rounded-lg text-xs text-[#9b9bb5] hover:text-iara-300 hover:bg-iara-900/30 disabled:opacity-30 transition-all"
        >
          <Save className="w-3.5 h-3.5" /> Salvar variante
        </button>

        {rerenderizando && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] text-iara-400">
            <Loader2 className="w-3 h-3 animate-spin" /> Renderizando...
          </span>
        )}
        {!rerenderizando && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] text-green-500/70">
            <Check className="w-3 h-3" /> Salvo
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-[#1a1a2e] bg-[#0f0f1e]">
        {ABAS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 min-h-11 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
              aba === id
                ? 'text-iara-300 border-iara-500'
                : 'text-[#6b6b8a] border-transparent hover:text-[#9b9bb5]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Conteúdo da aba */}
      <div className="p-4 sm:p-5">
        {aba === 'texto'  && <AbaTexto  layout={layout} update={update} disabled={rerenderizando} />}
        {aba === 'estilo' && <AbaEstilo layout={layout} update={update} disabled={rerenderizando} />}
        {aba === 'layout' && <AbaLayout layout={layout} update={update} disabled={rerenderizando} />}
        {aba === 'fundo'  && <AbaFundo  layout={layout} update={update} disabled={rerenderizando} />}
        {aba === 'foto'   && <AbaFoto   layout={layout} update={update} disabled={rerenderizando} layoutOriginal={layoutOriginal} imagemBase64={imagemBase64} />}
        {aba === 'extras' && <AbaExtras layout={layout} update={update} disabled={rerenderizando} />}
      </div>
    </div>
  )
}

// ─── Helpers UI compartilhados ──────────────────────────────────────────────────

function Section({ titulo, children, sub }: { titulo: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-2.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#6b6b8a]">{titulo}</p>
        {sub && <p className="text-[10px] text-[#4a4a6a] mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

function ColorRow({
  valor, onChange, paleta = PALETA_PRIMARIA, disabled,
}: {
  valor: string
  onChange: (cor: string) => void
  paleta?: string[]
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="color"
        value={valor}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-9 h-9 rounded-lg border border-[#2a2a4a] bg-transparent cursor-pointer disabled:opacity-50"
      />
      <span className="text-[10px] font-mono text-[#6b6b8a] min-w-[60px]">{valor}</span>
      <div className="flex gap-1.5 flex-wrap">
        {paleta.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            disabled={disabled}
            style={{ background: c }}
            className={`w-6 h-6 rounded-full border transition-all disabled:opacity-50 ${
              valor.toLowerCase() === c.toLowerCase() ? 'border-white scale-110' : 'border-white/20 hover:scale-110'
            }`}
            aria-label={`Cor ${c}`}
          />
        ))}
      </div>
    </div>
  )
}

function Slider({
  label, valor, min, max, step = 1, onChange, disabled, sufixo = 'px',
}: {
  label: string
  valor: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  disabled?: boolean
  sufixo?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-[#9b9bb5]">{label}</span>
        <span className="text-xs font-mono text-iara-400 tabular-nums">{valor}{sufixo}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valor}
        onChange={e => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full accent-iara-500 disabled:opacity-50"
      />
    </div>
  )
}

function Toggle({
  label, valor, onChange, disabled,
}: {
  label: string
  valor: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#1a1a2e] bg-[#0f0f1e] cursor-pointer min-h-11">
      <span className="text-sm text-[#c9c9d8]">{label}</span>
      <input
        type="checkbox"
        checked={valor}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <span className={`inline-block w-10 h-5 rounded-full bg-[#1a1a2e] peer-checked:bg-iara-600 relative transition-colors ${disabled ? 'opacity-50' : ''}`}>
        <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  )
}

// ─── ABAS ──────────────────────────────────────────────────────────────────────

function AbaTexto({ layout, update, disabled }: {
  layout: ThumbnailLayout
  update: (p: Partial<ThumbnailLayout>) => void
  disabled: boolean
}) {
  const [tituloLocal, setTituloLocal] = useState(layout.titulo)
  const [subtituloLocal, setSubtituloLocal] = useState(layout.subtitulo ?? '')
  const [eyebrowLocal, setEyebrowLocal] = useState(layout.eyebrow ?? '')
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({})

  // Sincroniza com props quando layout muda externo (undo/redo)
  useEffect(() => { setTituloLocal(layout.titulo) }, [layout.titulo])
  useEffect(() => { setSubtituloLocal(layout.subtitulo ?? '') }, [layout.subtitulo])
  useEffect(() => { setEyebrowLocal(layout.eyebrow ?? '') }, [layout.eyebrow])

  // Debounce: aplica mudança 600ms depois do último digit (por campo)
  function debounceUpdate(campo: 'titulo' | 'subtitulo' | 'eyebrow', valor: string) {
    const t = debounceRef.current[campo]
    if (t) clearTimeout(t)
    debounceRef.current[campo] = setTimeout(() => {
      // título não pode ficar vazio
      if (campo === 'titulo' && !valor.trim()) return
      update({ [campo]: campo === 'titulo' ? valor : (valor || undefined) } as Partial<ThumbnailLayout>)
    }, 600)
  }

  return (
    <div>
      <Section titulo="Eyebrow" sub="Texto pequeno acima do título (ex: REVELADO, EP. 7)">
        <input
          type="text"
          value={eyebrowLocal}
          onChange={e => { setEyebrowLocal(e.target.value); debounceUpdate('eyebrow', e.target.value) }}
          disabled={disabled}
          maxLength={30}
          placeholder="Opcional"
          className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-3 py-2.5 text-sm text-white placeholder:text-[#3a3a5a] focus:border-iara-700/60 focus:outline-none disabled:opacity-50"
        />
      </Section>

      <Section titulo="Título *" sub="Texto principal — máx 5 palavras pra alta legibilidade">
        <input
          type="text"
          value={tituloLocal}
          onChange={e => { setTituloLocal(e.target.value); debounceUpdate('titulo', e.target.value) }}
          disabled={disabled}
          maxLength={80}
          className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-3 py-3 text-base text-white focus:border-iara-700/60 focus:outline-none disabled:opacity-50"
        />
        <p className="text-[10px] text-[#5a5a7a] mt-1">
          {tituloLocal.split(/\s+/).filter(Boolean).length} palavra(s) · {tituloLocal.length}/80
        </p>
      </Section>

      <Section titulo="Subtítulo" sub="Complemento opcional (máx 8 palavras)">
        <input
          type="text"
          value={subtituloLocal}
          onChange={e => { setSubtituloLocal(e.target.value); debounceUpdate('subtitulo', e.target.value) }}
          disabled={disabled}
          maxLength={80}
          placeholder="Opcional"
          className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-3 py-2.5 text-sm text-white placeholder:text-[#3a3a5a] focus:border-iara-700/60 focus:outline-none disabled:opacity-50"
        />
      </Section>

      {/* Destaques por palavra */}
      <Section titulo="Destacar palavras do título" sub="Toque na palavra pra alternar destaque colorido">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {layout.titulo.split(/\s+/).filter(Boolean).map((palavra, idx) => {
            const destacada = layout.palavras_destaque?.find(d => d.indice === idx)
            return (
              <button
                key={idx}
                onClick={() => {
                  const atuais = layout.palavras_destaque ?? []
                  const novo = destacada
                    ? atuais.filter(d => d.indice !== idx)
                    : [...atuais, { indice: idx, cor: '#ec4899' }]
                  update({ palavras_destaque: novo })
                }}
                disabled={disabled}
                className="px-3 min-h-9 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                style={destacada ? {
                  background: destacada.cor + '22',
                  color: destacada.cor,
                  boxShadow: `0 0 0 1.5px ${destacada.cor}`,
                } : {
                  background: '#1a1a2e',
                  color: '#c1c1d8',
                }}
              >
                {palavra}
              </button>
            )
          })}
        </div>

        {(layout.palavras_destaque?.length ?? 0) > 0 && (
          <>
            <p className="text-[10px] text-[#6b6b8a] mb-2">Cor do destaque:</p>
            <ColorRow
              valor={layout.palavras_destaque?.[0]?.cor ?? '#ec4899'}
              onChange={(cor) => {
                const novo = (layout.palavras_destaque ?? []).map(d => ({ ...d, cor }))
                update({ palavras_destaque: novo })
              }}
              disabled={disabled}
            />
            <button
              onClick={() => update({ palavras_destaque: [] })}
              disabled={disabled}
              className="mt-2 text-[10px] text-[#5a5a7a] hover:text-red-400 transition-colors disabled:opacity-50"
            >
              × Remover todos os destaques
            </button>
          </>
        )}
      </Section>

      <Section titulo="Cor base do título">
        <ColorRow valor={layout.titulo_cor} onChange={(cor) => update({ titulo_cor: cor })} disabled={disabled} />
      </Section>
    </div>
  )
}

function AbaEstilo({ layout, update, disabled }: {
  layout: ThumbnailLayout
  update: (p: Partial<ThumbnailLayout>) => void
  disabled: boolean
}) {
  return (
    <div>
      <Section titulo="Fonte do título">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
          {FONTES.map(f => (
            <button
              key={f.id}
              onClick={() => update({ fonte: f.id })}
              disabled={disabled}
              className={`p-3 rounded-xl border text-left transition-all disabled:opacity-50 ${
                layout.fonte === f.id
                  ? 'border-iara-500 bg-iara-900/30'
                  : 'border-[#1a1a2e] bg-[#0f0f1e] hover:border-iara-700/40'
              }`}
            >
              <p className="text-[9px] uppercase tracking-wider text-[#6b6b8a] mb-1">{f.label}</p>
              <p
                className="text-base text-white truncate"
                style={{ fontFamily: f.family, fontWeight: f.weight, fontStyle: f.id.includes('italic') ? 'italic' : 'normal' }}
              >
                Aa
              </p>
            </button>
          ))}
        </div>
      </Section>

      <Section titulo="Tamanho do título" sub="Ajuste fino do tamanho da fonte (px no canvas 1280×720)">
        <Slider
          label="Tamanho"
          valor={layout.tamanho_titulo}
          min={60} max={180} step={2}
          onChange={(v) => update({ tamanho_titulo: v })}
          disabled={disabled}
        />
      </Section>

      <Section titulo="Largura do bloco de texto" sub="Quanto da largura o texto ocupa">
        <Slider
          label="Largura"
          valor={layout.texto_largura_pct}
          min={35} max={100} step={5}
          onChange={(v) => update({ texto_largura_pct: v })}
          disabled={disabled}
          sufixo="%"
        />
      </Section>

      <Section titulo="Efeitos no título">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Toggle
            label="Sombra"
            valor={!!layout.titulo_sombra}
            onChange={(v) => update({ titulo_sombra: v })}
            disabled={disabled}
          />
          <Toggle
            label="Contorno"
            valor={!!layout.titulo_contorno}
            onChange={(v) => update({ titulo_contorno: v })}
            disabled={disabled}
          />
        </div>

        {layout.titulo_contorno && (
          <div className="mt-3">
            <p className="text-[10px] text-[#6b6b8a] mb-1.5">Cor do contorno</p>
            <ColorRow
              valor={layout.titulo_contorno_cor ?? '#000000'}
              onChange={(cor) => update({ titulo_contorno_cor: cor })}
              disabled={disabled}
            />
          </div>
        )}
      </Section>

      <Section titulo="Caixa atrás do título" sub="Fundo colorido sob o título (opcional)">
        <ColorRow
          valor={layout.titulo_fundo ?? '#000000'}
          onChange={(cor) => update({ titulo_fundo: cor })}
          disabled={disabled}
        />
        {layout.titulo_fundo && (
          <button
            onClick={() => update({ titulo_fundo: undefined })}
            disabled={disabled}
            className="mt-2 text-[10px] text-[#5a5a7a] hover:text-red-400 transition-colors"
          >
            × Remover caixa
          </button>
        )}
      </Section>
    </div>
  )
}

function AbaLayout({ layout, update, disabled }: {
  layout: ThumbnailLayout
  update: (p: Partial<ThumbnailLayout>) => void
  disabled: boolean
}) {
  return (
    <div>
      <Section titulo="Posição do bloco de texto" sub="Onde o título fica posicionado">
        <div className="grid grid-cols-3 gap-1.5 max-w-[200px] mx-auto sm:mx-0">
          {ANCORAS.map(a => {
            const ativa = layout.texto_ancora === a.id
            const Icon = a.col === 0 ? AlignLeft : a.col === 2 ? AlignRight : AlignCenter
            return (
              <button
                key={a.id}
                onClick={() => update({ texto_ancora: a.id })}
                disabled={disabled}
                aria-label={a.id.replace('_', ' ')}
                className={`aspect-square rounded-lg border-2 flex items-center justify-center transition-all disabled:opacity-50 ${
                  ativa
                    ? 'border-iara-500 bg-iara-900/30 text-iara-300'
                    : 'border-[#1a1a2e] bg-[#0f0f1e] text-[#5a5a7a] hover:border-iara-700/40'
                }`}
                style={{
                  alignItems: a.row === 0 ? 'flex-start' : a.row === 2 ? 'flex-end' : 'center',
                  justifyContent: a.col === 0 ? 'flex-start' : a.col === 2 ? 'flex-end' : 'center',
                  padding: '6px',
                }}
              >
                <Icon className="w-4 h-4" />
              </button>
            )
          })}
        </div>
        <p className="text-[10px] text-[#5a5a7a] mt-2 capitalize">{layout.texto_ancora.replace('_', ' ')}</p>
      </Section>
    </div>
  )
}

function AbaFundo({ layout, update, disabled }: {
  layout: ThumbnailLayout
  update: (p: Partial<ThumbnailLayout>) => void
  disabled: boolean
}) {
  return (
    <div>
      <Section titulo="Tipo de fundo">
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: 'cor_solida',         label: 'Cor sólida' },
            { id: 'gradiente_linear',   label: 'Linear' },
            { id: 'gradiente_radial',   label: 'Radial' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => update({ fundo_tipo: t.id })}
              disabled={disabled}
              className={`p-3 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50 ${
                layout.fundo_tipo === t.id
                  ? 'border-iara-500 bg-iara-900/30 text-iara-300'
                  : 'border-[#1a1a2e] bg-[#0f0f1e] text-[#9b9bb5] hover:border-iara-700/40'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Section>

      <Section titulo="Cor 1">
        <ColorRow
          valor={layout.fundo_cor1}
          onChange={(cor) => update({ fundo_cor1: cor })}
          disabled={disabled}
        />
      </Section>

      {layout.fundo_tipo !== 'cor_solida' && (
        <>
          <Section titulo="Cor 2">
            <ColorRow
              valor={layout.fundo_cor2 ?? '#000000'}
              onChange={(cor) => update({ fundo_cor2: cor })}
              disabled={disabled}
            />
          </Section>

          {layout.fundo_tipo === 'gradiente_linear' && (
            <Section titulo="Direção do gradiente">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { id: 'horizontal',   label: '→', desc: 'Horizontal' },
                  { id: 'vertical',     label: '↓', desc: 'Vertical' },
                  { id: 'diagonal_135', label: '↘', desc: 'Diagonal' },
                  { id: 'diagonal_45',  label: '↗', desc: 'Diagonal ↗' },
                ] as const).map(d => (
                  <button
                    key={d.id}
                    onClick={() => update({ fundo_direcao: d.id })}
                    disabled={disabled}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all disabled:opacity-50 ${
                      layout.fundo_direcao === d.id
                        ? 'border-iara-500 bg-iara-900/30 text-iara-300'
                        : 'border-[#1a1a2e] bg-[#0f0f1e] text-[#9b9bb5] hover:border-iara-700/40'
                    }`}
                  >
                    <span className="text-xl">{d.label}</span>
                    <span className="text-[9px]">{d.desc}</span>
                  </button>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  )
}

function AbaFoto({ layout, update, disabled, layoutOriginal, imagemBase64 }: {
  layout: ThumbnailLayout
  update: (p: Partial<ThumbnailLayout>) => void
  disabled: boolean
  layoutOriginal: ThumbnailLayout
  imagemBase64?: string | null
}) {
  const temFoto = layout.foto_zona !== 'nenhuma'

  if (layoutOriginal.foto_zona === 'nenhuma') {
    return (
      <div className="text-center py-8 text-sm text-[#6b6b8a]">
        Você não enviou foto. Pra ajustar foto, gere a thumbnail novamente com upload.
      </div>
    )
  }

  return (
    <div>
      <Section titulo="Quanto da tela a foto ocupa" sub="Templates rápidos — escolha um e ajuste o foco abaixo">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ZONAS_FOTO.map(z => (
            <button
              key={z.id}
              onClick={() => update({ foto_zona: z.id })}
              disabled={disabled}
              className={`p-2.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50 ${
                layout.foto_zona === z.id
                  ? 'border-iara-500 bg-iara-900/30 text-iara-300'
                  : 'border-[#1a1a2e] bg-[#0f0f1e] text-[#9b9bb5] hover:border-iara-700/40'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>
      </Section>

      {temFoto && (
        <>
          <Section titulo="Posição livre da foto" sub="Arraste o ponto de foco no preview, ou use os sliders pra ajuste fino">
            <FotoFundoDragger
              fotoSrc={imagemBase64 ?? null}
              valor={layout.foto_object_pos ?? 'center'}
              onChange={(novo) => update({ foto_object_pos: novo })}
              disabled={disabled}
            />
          </Section>

          <Section titulo="Overlay sobre a foto" sub="Escurece a foto pra texto ficar legível em cima">
            <div className="grid grid-cols-4 gap-2">
              {[
                { v: undefined,                label: 'Sem' },
                { v: 'rgba(0,0,0,0.35)',       label: 'Leve' },
                { v: 'rgba(0,0,0,0.55)',       label: 'Médio' },
                { v: 'rgba(0,0,0,0.75)',       label: 'Forte' },
              ].map(o => {
                const ativo = (layout.foto_overlay_cor ?? undefined) === o.v
                return (
                  <button
                    key={o.label}
                    onClick={() => update({ foto_overlay_cor: o.v })}
                    disabled={disabled}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50 ${
                      ativo
                        ? 'border-iara-500 bg-iara-900/30 text-iara-300'
                        : 'border-[#1a1a2e] bg-[#0f0f1e] text-[#9b9bb5] hover:border-iara-700/40'
                    }`}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
          </Section>
        </>
      )}
    </div>
  )
}

function AbaExtras({ layout, update, disabled }: {
  layout: ThumbnailLayout
  update: (p: Partial<ThumbnailLayout>) => void
  disabled: boolean
}) {
  const [badgeLocal, setBadgeLocal] = useState(layout.badge ?? '')
  const badgeRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => { setBadgeLocal(layout.badge ?? '') }, [layout.badge])

  function debouncedSetBadge(v: string) {
    setBadgeLocal(v)
    if (badgeRef.current) clearTimeout(badgeRef.current)
    badgeRef.current = setTimeout(() => update({ badge: v || undefined }), 600)
  }

  return (
    <div>
      <Section titulo="Badge" sub="Selo curto pra urgência (ex: GRÁTIS, NOVO, #1)">
        <input
          type="text"
          value={badgeLocal}
          onChange={e => debouncedSetBadge(e.target.value.slice(0, 12))}
          disabled={disabled}
          maxLength={12}
          placeholder="Opcional"
          className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-3 py-2.5 text-sm text-white placeholder:text-[#3a3a5a] focus:border-iara-700/60 focus:outline-none disabled:opacity-50"
        />

        {layout.badge && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-[#6b6b8a] mb-1.5">Posição</p>
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  { id: 'topo_esq', label: '↖' },
                  { id: 'topo_dir', label: '↗' },
                  { id: 'base_esq', label: '↙' },
                  { id: 'base_dir', label: '↘' },
                ] as const).map(p => (
                  <button
                    key={p.id}
                    onClick={() => update({ badge_posicao: p.id })}
                    disabled={disabled}
                    className={`min-h-9 rounded-lg border text-base transition-all disabled:opacity-50 ${
                      layout.badge_posicao === p.id
                        ? 'border-iara-500 bg-iara-900/30 text-iara-300'
                        : 'border-[#1a1a2e] bg-[#0f0f1e] text-[#5a5a7a] hover:border-iara-700/40'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-[#6b6b8a] mb-1.5">Cor de fundo</p>
              <ColorRow
                valor={layout.badge_cor_fundo ?? '#ec4899'}
                onChange={(cor) => update({ badge_cor_fundo: cor })}
                disabled={disabled}
                paleta={['#ec4899', '#fbbf24', '#10b981', '#ef4444', '#a855f7']}
              />
            </div>
          </div>
        )}
      </Section>

      <Section titulo="Linha de acento" sub="Barra colorida ao lado/embaixo do título">
        <Toggle
          label="Mostrar linha de acento"
          valor={!!layout.linha_acento}
          onChange={(v) => update({ linha_acento: v })}
          disabled={disabled}
        />
        {layout.linha_acento && (
          <div className="mt-3">
            <p className="text-[10px] text-[#6b6b8a] mb-1.5">Cor da linha</p>
            <ColorRow
              valor={layout.linha_acento_cor ?? '#ec4899'}
              onChange={(cor) => update({ linha_acento_cor: cor })}
              disabled={disabled}
            />
          </div>
        )}
      </Section>
    </div>
  )
}
