'use client'

import { useState } from 'react'
import {
  Layers, Sparkles, ChevronLeft, ChevronRight,
  Copy, Check, RefreshCw, Lightbulb, Clock,
} from 'lucide-react'

// ─── tipos ────────────────────────────────────────────────────────────────────

interface StorySlide {
  numero: number
  tipo: 'hook' | 'desenvolvimento' | 'virada' | 'cta' | 'encerramento'
  texto_principal: string
  texto_secundario?: string
  emoji: string
  cor_fundo: string
  cor_texto: string
  dica_visual: string
  duracao: number
}

// ─── constantes ───────────────────────────────────────────────────────────────

const TIPOS = [
  { value: 'educativo',    label: 'Educativo',    emoji: '📚', desc: 'Ensina algo passo a passo' },
  { value: 'bastidores',   label: 'Bastidores',   emoji: '🎬', desc: 'Processo, dia a dia, vida real' },
  { value: 'lancamento',   label: 'Lançamento',   emoji: '🚀', desc: 'Anuncia produto ou novidade' },
  { value: 'engajamento',  label: 'Engajamento',  emoji: '💬', desc: 'Enquete, pergunta, interação' },
  { value: 'hot_take',     label: 'Hot Take',     emoji: '🔥', desc: 'Opinião, posicionamento, polêmica' },
  { value: 'motivacional', label: 'Motivacional', emoji: '⚡', desc: 'História, frase de impacto' },
]

const TIPO_LABELS: Record<string, string> = {
  hook:          'Hook',
  desenvolvimento: 'Conteúdo',
  virada:        'Virada',
  cta:           'CTA',
  encerramento:  'Encerramento',
}

const TIPO_COLORS: Record<string, string> = {
  hook:          'text-yellow-400 bg-yellow-900/20 border-yellow-800/30',
  desenvolvimento: 'text-iara-400 bg-iara-900/20 border-iara-700/30',
  virada:        'text-accent-purple bg-purple-900/20 border-purple-800/30',
  cta:           'text-green-400 bg-green-900/20 border-green-800/30',
  encerramento:  'text-[#9b9bb5] bg-[#1a1a2e] border-[#2a2a4a]',
}

// ─── componente de slide ──────────────────────────────────────────────────────

function SlidePreview({ slide, total }: { slide: StorySlide; total: number }) {
  const [copied, setCopied] = useState(false)

  function copyText() {
    const text = [slide.texto_principal, slide.texto_secundario].filter(Boolean).join('\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* preview do story */}
      <div
        className="relative w-[260px] h-[462px] rounded-2xl flex flex-col items-center justify-center p-6 shadow-2xl shadow-black/60 overflow-hidden"
        style={{ backgroundColor: slide.cor_fundo, color: slide.cor_texto }}
      >
        {/* barra de progresso */}
        <div className="absolute top-3 left-3 right-3 flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className="h-0.5 flex-1 rounded-full"
              style={{
                backgroundColor: i < slide.numero ? slide.cor_texto : `${slide.cor_texto}40`,
              }}
            />
          ))}
        </div>

        {/* conteúdo */}
        <div className="text-center space-y-4">
          <div className="text-5xl">{slide.emoji}</div>
          <p
            className="text-xl font-bold leading-tight"
            style={{ color: slide.cor_texto }}
          >
            {slide.texto_principal}
          </p>
          {slide.texto_secundario && (
            <p
              className="text-sm leading-relaxed opacity-80"
              style={{ color: slide.cor_texto }}
            >
              {slide.texto_secundario}
            </p>
          )}
        </div>

        {/* duração */}
        <div
          className="absolute bottom-4 flex items-center gap-1 text-xs opacity-60"
          style={{ color: slide.cor_texto }}
        >
          <Clock className="w-3 h-3" />
          {slide.duracao}s
        </div>
      </div>

      {/* badge tipo + botão copiar */}
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${TIPO_COLORS[slide.tipo]}`}>
          {TIPO_LABELS[slide.tipo]}
        </span>
        <button
          onClick={copyText}
          className="flex items-center gap-1.5 text-xs text-[#5a5a7a] hover:text-iara-400 transition-colors px-2.5 py-1 rounded-lg hover:bg-iara-900/20"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copiado!' : 'Copiar texto'}
        </button>
      </div>

      {/* dica visual */}
      <div className="w-full max-w-[320px] bg-[#0d0d1a] rounded-xl p-3 border border-[#1a1a2e]">
        <p className="text-xs text-[#5a5a7a] font-medium mb-1">💡 Como montar no app</p>
        <p className="text-xs text-[#9b9bb5] leading-relaxed">{slide.dica_visual}</p>
      </div>
    </div>
  )
}

// ─── página principal ─────────────────────────────────────────────────────────

export default function StoriesPage() {
  const [tipo, setTipo] = useState('educativo')
  const [tema, setTema] = useState('')
  const [contexto, setContexto] = useState('')
  const [gerando, setGerando] = useState(false)

  const [slides, setSlides] = useState<StorySlide[]>([])
  const [dicaGeral, setDicaGeral] = useState('')
  const [slideAtual, setSlideAtual] = useState(0)

  const [erro, setErro] = useState('')

  async function handleGerar() {
    if (!tema.trim()) return
    setGerando(true)
    setErro('')
    setSlides([])

    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema, tipo, contexto }),
      })

      if (!res.ok) {
        const d = await res.json()
        setErro(d.error ?? 'Erro ao gerar stories')
        return
      }

      const data = await res.json()
      setSlides(data.slides ?? [])
      setDicaGeral(data.dica_geral ?? '')
      setSlideAtual(0)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setGerando(false)
    }
  }

  function copiarTudo() {
    const texto = slides.map((s, i) =>
      `--- SLIDE ${i + 1} (${TIPO_LABELS[s.tipo]}) ---\n${s.emoji} ${s.texto_principal}${s.texto_secundario ? `\n${s.texto_secundario}` : ''}`
    ).join('\n\n')
    navigator.clipboard.writeText(texto)
  }

  const temSlides = slides.length > 0
  const slide = slides[slideAtual]

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-iara-400 text-sm font-medium mb-2">
          <Layers className="w-4 h-4" />
          <span>Geração de conteúdo</span>
        </div>
        <h1 className="text-3xl font-bold text-[#f1f1f8]">
          Gerador de <span className="iara-gradient-text">Stories</span>
        </h1>
        <p className="mt-1 text-[#9b9bb5] text-sm">
          Sequência de 7 slides personalizada para o seu perfil e tom de voz.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-start">

        {/* ── painel esquerdo: configuração ───────────────────────────── */}
        <div className="space-y-6">

          {/* tipo de story */}
          <div>
            <label className="iara-label block mb-3">Tipo de sequência</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition-all ${
                    tipo === t.value
                      ? 'bg-iara-600/20 border-iara-600/40 text-[#f1f1f8]'
                      : 'bg-[#0a0a14] border-[#1a1a2e] text-[#9b9bb5] hover:border-[#2a2a4a]'
                  }`}
                >
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-xs font-semibold">{t.label}</span>
                  <span className="text-[10px] opacity-70 leading-tight">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* tema */}
          <div>
            <label className="iara-label block mb-1.5">Sobre o que são os stories?</label>
            <input
              type="text"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder={
                tipo === 'educativo'    ? 'ex: Como crescer no Instagram sem comprar seguidores' :
                tipo === 'bastidores'   ? 'ex: Meu processo de criação de um Reel do zero' :
                tipo === 'lancamento'   ? 'ex: Lançamento do meu curso de edição de vídeo' :
                tipo === 'engajamento'  ? 'ex: Vocês preferem conteúdo mais pessoal ou educativo?' :
                tipo === 'hot_take'     ? 'ex: Por que quantidade bate qualidade no início' :
                'ex: Como a consistência mudou minha vida como criador'
              }
              className="iara-input w-full"
              onKeyDown={(e) => e.key === 'Enter' && handleGerar()}
            />
          </div>

          {/* contexto extra */}
          <div>
            <label className="iara-label block mb-1.5">
              Contexto adicional{' '}
              <span className="text-[#5a5a7a] font-normal">(opcional)</span>
            </label>
            <textarea
              value={contexto}
              onChange={(e) => setContexto(e.target.value)}
              placeholder="Detalhes específicos, tom que quer usar, algo importante a mencionar..."
              rows={3}
              className="iara-input w-full resize-none"
            />
          </div>

          {/* botão gerar */}
          <button
            onClick={handleGerar}
            disabled={!tema.trim() || gerando}
            className="iara-btn-primary w-full py-3 text-base"
          >
            {gerando
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Criando sequência…</>
              : <><Sparkles className="w-4 h-4" /> Gerar sequência de stories</>
            }
          </button>

          {erro && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-xl px-4 py-3">
              {erro}
            </p>
          )}

          {/* dica geral */}
          {dicaGeral && (
            <div className="flex gap-3 p-4 bg-iara-900/20 border border-iara-700/20 rounded-xl">
              <Lightbulb className="w-4 h-4 text-iara-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-iara-400 mb-1">Dica estratégica</p>
                <p className="text-sm text-[#9b9bb5] leading-relaxed">{dicaGeral}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── painel direito: preview dos slides ──────────────────────── */}
        {temSlides && slide && (
          <div className="flex flex-col items-center gap-5 lg:sticky lg:top-6">

            {/* navegação */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSlideAtual((v) => Math.max(0, v - 1))}
                disabled={slideAtual === 0}
                className="w-9 h-9 rounded-xl border border-[#1a1a2e] flex items-center justify-center text-[#9b9bb5] hover:bg-[#1a1a2e] disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-sm text-[#9b9bb5]">
                <span className="text-[#f1f1f8] font-semibold">{slideAtual + 1}</span>
                {' '}/ {slides.length}
              </span>

              <button
                onClick={() => setSlideAtual((v) => Math.min(slides.length - 1, v + 1))}
                disabled={slideAtual === slides.length - 1}
                className="w-9 h-9 rounded-xl border border-[#1a1a2e] flex items-center justify-center text-[#9b9bb5] hover:bg-[#1a1a2e] disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <SlidePreview slide={slide} total={slides.length} />

            {/* dots de navegação */}
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideAtual(i)}
                  className={`rounded-full transition-all ${
                    i === slideAtual
                      ? 'w-5 h-2 bg-iara-400'
                      : 'w-2 h-2 bg-[#2a2a4a] hover:bg-[#3a3a5a]'
                  }`}
                />
              ))}
            </div>

            {/* ação: copiar todos */}
            <button
              onClick={copiarTudo}
              className="flex items-center gap-2 text-sm text-[#9b9bb5] hover:text-iara-400 transition-colors px-4 py-2 rounded-xl border border-[#1a1a2e] hover:border-iara-700/40 hover:bg-iara-900/20"
            >
              <Copy className="w-4 h-4" /> Copiar todos os textos
            </button>
          </div>
        )}

        {/* estado vazio — sem slides ainda */}
        {!temSlides && !gerando && (
          <div className="hidden lg:flex flex-col items-center justify-center gap-4 text-center py-16 px-8">
            <div className="w-16 h-16 rounded-2xl bg-iara-900/30 border border-iara-700/20 flex items-center justify-center">
              <Layers className="w-7 h-7 text-iara-700" />
            </div>
            <p className="text-sm text-[#5a5a7a] max-w-[200px] leading-relaxed">
              Preencha o tema e gere sua sequência de stories
            </p>
          </div>
        )}

        {/* loading skeleton */}
        {gerando && (
          <div className="hidden lg:flex flex-col items-center gap-4">
            <div className="w-[260px] h-[462px] rounded-2xl bg-[#13131f] border border-[#1a1a2e] animate-pulse" />
            <div className="flex gap-1.5">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#2a2a4a] animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── lista de todos os slides (mobile e overview) ─────────────── */}
      {temSlides && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-[#f1f1f8] mb-4">Todos os slides</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => setSlideAtual(i)}
                className={`iara-card p-4 text-left border transition-all hover:scale-[1.01] ${
                  i === slideAtual ? 'border-iara-600/40 bg-iara-900/10' : 'border-[#1a1a2e]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#5a5a7a]">Slide {i + 1}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${TIPO_COLORS[s.tipo]}`}>
                    {TIPO_LABELS[s.tipo]}
                  </span>
                </div>
                <p className="text-lg mb-1">{s.emoji}</p>
                <p className="text-xs text-[#c4c4d8] leading-snug line-clamp-2">{s.texto_principal}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
