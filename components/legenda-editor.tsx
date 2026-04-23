'use client'

import { useState, useMemo } from 'react'
import { Download, Loader2, Type, Palette, Zap, AlignVerticalSpaceAround, Bold } from 'lucide-react'

export type EstiloLegenda = {
  fonte: string
  cor: string
  cor_contorno: string
  tamanho: number
  animacao: 'pop' | 'slide' | 'fade' | 'typewriter' | 'bounce' | 'none'
  negrito: boolean
  posicao: 'baixo' | 'centro' | 'alto'
}

// 17 fontes (subset curado — todas com peso 700/900 e boa pro TikTok/Reels)
const FONTES: { nome: string; descricao: string; css: string }[] = [
  { nome: 'Inter',          descricao: 'Clean — SaaS',           css: 'Inter, sans-serif' },
  { nome: 'Anton',          descricao: 'Sans condensed — viral', css: 'Anton, sans-serif' },
  { nome: 'Bebas Neue',     descricao: 'Alta — impacto',         css: '"Bebas Neue", sans-serif' },
  { nome: 'Archivo Black',  descricao: 'Grossa — viralizer',     css: '"Archivo Black", sans-serif' },
  { nome: 'Poppins',        descricao: 'Moderna — YouTube',      css: 'Poppins, sans-serif' },
  { nome: 'Montserrat',     descricao: 'Elegante — fitness',     css: 'Montserrat, sans-serif' },
  { nome: 'Oswald',         descricao: 'Condensada — esporte',   css: 'Oswald, sans-serif' },
  { nome: 'Raleway',        descricao: 'Fina — beleza',          css: 'Raleway, sans-serif' },
  { nome: 'Bangers',        descricao: 'Comic — humor',          css: 'Bangers, cursive' },
  { nome: 'Lobster',        descricao: 'Cursiva — food',         css: 'Lobster, cursive' },
  { nome: 'Permanent Marker',descricao: 'Marker — casual',       css: '"Permanent Marker", cursive' },
  { nome: 'Bungee',         descricao: 'Block — kids',           css: 'Bungee, sans-serif' },
  { nome: 'Teko',           descricao: 'Technical — tech',       css: 'Teko, sans-serif' },
  { nome: 'Rubik Mono One', descricao: 'Mono bold — crypto',     css: '"Rubik Mono One", monospace' },
  { nome: 'Righteous',      descricao: 'Geométrica — gaming',    css: 'Righteous, sans-serif' },
  { nome: 'Playfair Display',descricao: 'Serifa — luxo',         css: '"Playfair Display", serif' },
  { nome: 'Fredoka One',    descricao: 'Round — lifestyle',      css: '"Fredoka One", cursive' },
]

const CORES: { nome: string; hex: string }[] = [
  { nome: 'Branco',   hex: '#FFFFFF' },
  { nome: 'Preto',    hex: '#000000' },
  { nome: 'Amarelo',  hex: '#FFE500' },
  { nome: 'Ciano',    hex: '#00E5FF' },
  { nome: 'Rosa neon',hex: '#FF2E7E' },
  { nome: 'Verde',    hex: '#00FF88' },
  { nome: 'Laranja',  hex: '#FF6B00' },
  { nome: 'Roxo',     hex: '#A855F7' },
  { nome: 'Ouro',     hex: '#E2C068' },
]

const ANIMACOES: { id: EstiloLegenda['animacao']; label: string; emoji: string }[] = [
  { id: 'pop',         label: 'Pop',          emoji: '💥' },
  { id: 'slide',       label: 'Slide',        emoji: '➡️' },
  { id: 'fade',        label: 'Fade',         emoji: '✨' },
  { id: 'typewriter',  label: 'Typewriter',   emoji: '⌨️' },
  { id: 'bounce',      label: 'Bounce',       emoji: '🏀' },
  { id: 'none',        label: 'Estático',     emoji: '―' },
]

// Preset styles inspirados em creators virais
const PRESETS: { nome: string; estilo: EstiloLegenda }[] = [
  { nome: 'MrBeast',   estilo: { fonte: 'Archivo Black', cor: '#FFFFFF', cor_contorno: '#000000', tamanho: 70, animacao: 'pop',    negrito: true,  posicao: 'baixo' } },
  { nome: 'ColdFusion',estilo: { fonte: 'Inter',         cor: '#FFFFFF', cor_contorno: '#000000', tamanho: 50, animacao: 'fade',   negrito: true,  posicao: 'baixo' } },
  { nome: 'Iman Gadzhi',estilo: { fonte: 'Montserrat',   cor: '#FFFFFF', cor_contorno: '#000000', tamanho: 55, animacao: 'none',   negrito: true,  posicao: 'centro' } },
  { nome: 'Ali Abdaal',estilo: { fonte: 'Poppins',       cor: '#FFE500', cor_contorno: '#000000', tamanho: 60, animacao: 'pop',    negrito: true,  posicao: 'baixo' } },
  { nome: 'Casey Neistat',estilo:{ fonte: 'Bebas Neue',  cor: '#FFFFFF', cor_contorno: '#000000', tamanho: 80, animacao: 'slide',  negrito: false, posicao: 'alto' } },
  { nome: 'Podcast Pro',estilo:{ fonte: 'Anton',         cor: '#00E5FF', cor_contorno: '#000000', tamanho: 65, animacao: 'bounce', negrito: false, posicao: 'centro' } },
]

type Props = {
  trechoId: string
  videoId: string
  textoPreview?: string          // exemplo de texto pra preview
  onSalvo?: (estilo: EstiloLegenda) => void
  estiloInicial?: Partial<EstiloLegenda>
  corAcento?: string             // pink pro criador, purple pra marca
}

export function LegendaEditor({ trechoId, videoId, textoPreview = 'Esse aqui é o preview da sua legenda', onSalvo, estiloInicial, corAcento = '#ec4899' }: Props) {
  const [estilo, setEstilo] = useState<EstiloLegenda>({
    fonte: 'Archivo Black',
    cor: '#FFFFFF',
    cor_contorno: '#000000',
    tamanho: 60,
    animacao: 'pop',
    negrito: true,
    posicao: 'baixo',
    ...estiloInicial,
  })
  const [baixando, setBaixando] = useState<'srt' | 'ass' | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const fonteCSS = useMemo(() =>
    FONTES.find(f => f.nome === estilo.fonte)?.css ?? estilo.fonte,
    [estilo.fonte]
  )

  const tamanhoPx = useMemo(() =>
    Math.max(18, Math.min(72, Math.round(estilo.tamanho * 0.7))),
    [estilo.tamanho]
  )

  // Shadow/contorno simulado via múltiplas sombras
  const textShadow = useMemo(() => {
    const c = estilo.cor_contorno
    const o = 2
    return `${-o}px ${-o}px 0 ${c}, ${o}px ${-o}px 0 ${c}, ${-o}px ${o}px 0 ${c}, ${o}px ${o}px 0 ${c}, 0 ${o * 2}px ${o * 2}px rgba(0,0,0,0.8)`
  }, [estilo.cor_contorno])

  const animacaoClass = useMemo(() => {
    switch (estilo.animacao) {
      case 'pop':        return 'animate-legenda-pop'
      case 'slide':      return 'animate-legenda-slide'
      case 'fade':       return 'animate-legenda-fade'
      case 'typewriter': return 'animate-legenda-typewriter'
      case 'bounce':     return 'animate-legenda-bounce'
      default:           return ''
    }
  }, [estilo.animacao])

  const alignY = estilo.posicao === 'alto' ? 'items-start pt-10' : estilo.posicao === 'centro' ? 'items-center' : 'items-end pb-12'

  async function baixar(formato: 'srt' | 'ass') {
    setBaixando(formato); setErro(null)
    try {
      const res = await fetch(`/api/cortes/${videoId}/legenda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trecho_id: trechoId, formato, estilo }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setErro(j.error ?? 'Erro ao gerar legenda')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `legenda-${trechoId.slice(0, 8)}.${formato}`
      a.click()
      URL.revokeObjectURL(url)
      onSalvo?.(estilo)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro')
    } finally {
      setBaixando(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=Bangers&family=Bebas+Neue&family=Bungee&family=Fredoka+One&family=Inter:wght@400;700;900&family=Lobster&family=Montserrat:wght@400;700;900&family=Oswald:wght@400;700&family=Permanent+Marker&family=Playfair+Display:wght@700;900&family=Poppins:wght@400;700;900&family=Raleway:wght@400;700;900&family=Righteous&family=Rubik+Mono+One&family=Teko:wght@400;700&display=swap"
      />

      <style jsx global>{`
        @keyframes legenda-pop   { 0%{transform:scale(.6);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        @keyframes legenda-slide { 0%{transform:translateY(40px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes legenda-fade  { 0%{opacity:0} 100%{opacity:1} }
        @keyframes legenda-type  { 0%{clip-path:inset(0 100% 0 0)} 100%{clip-path:inset(0 0 0 0)} }
        @keyframes legenda-bounce{ 0%{transform:translateY(0)} 30%{transform:translateY(-18px)} 60%{transform:translateY(0)} 80%{transform:translateY(-6px)} 100%{transform:translateY(0)} }
        .animate-legenda-pop        { animation: legenda-pop .4s cubic-bezier(.34,1.56,.64,1) both; }
        .animate-legenda-slide      { animation: legenda-slide .35s ease-out both; }
        .animate-legenda-fade       { animation: legenda-fade .5s ease both; }
        .animate-legenda-typewriter { animation: legenda-type 1.2s steps(22) both; }
        .animate-legenda-bounce     { animation: legenda-bounce .9s ease both; }
      `}</style>

      {/* Preview */}
      <div className="rounded-2xl border border-[#1a1a2e] bg-[#08080f] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d0d1a] border-b border-[#1a1a2e]">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#6b6b8a]">Preview 9:16</span>
          <div className="flex gap-1">
            <button
              onClick={() => setEstilo(s => ({ ...s }))}
              className="text-[10px] px-2 py-1 rounded-md text-[#9b9bb5] hover:bg-white/5"
              title="Reproduzir animação"
            >
              ↻ Animar
            </button>
          </div>
        </div>
        <div className={`relative mx-auto aspect-[9/16] max-w-[240px] bg-gradient-to-br from-[#1a1a2e] via-[#0d0d1a] to-[#08080f] flex justify-center ${alignY}`}
          style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(168,85,247,0.15), transparent 60%), radial-gradient(circle at 70% 80%, rgba(236,72,153,0.12), transparent 60%)' }}
        >
          <div className={`max-w-[85%] text-center leading-[1.1] px-2 ${animacaoClass}`}
            key={`${estilo.animacao}-${estilo.fonte}-${estilo.cor}-${estilo.tamanho}`}
            style={{
              fontFamily: fonteCSS,
              fontSize: `${tamanhoPx}px`,
              color: estilo.cor,
              fontWeight: estilo.negrito ? 900 : 500,
              textShadow,
              letterSpacing: '-0.01em',
              textTransform: estilo.fonte === 'Anton' || estilo.fonte === 'Bebas Neue' || estilo.fonte === 'Oswald' ? 'uppercase' : 'none',
            }}
          >
            {textoPreview}
          </div>
        </div>
      </div>

      {/* Presets virais — atalho CapCut-style */}
      <div>
        <label className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-2">
          <Zap className="w-3 h-3" />
          Presets virais
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {PRESETS.map(p => {
            const ativo = estilo.fonte === p.estilo.fonte && estilo.animacao === p.estilo.animacao && estilo.cor === p.estilo.cor
            return (
              <button
                key={p.nome}
                onClick={() => setEstilo(p.estilo)}
                className={`shrink-0 px-3 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all ${
                  ativo
                    ? 'border-transparent text-white'
                    : 'border-[#1a1a2e] bg-[#0d0d1a] text-[#9b9bb5] hover:border-[#2a2a4a]'
                }`}
                style={ativo ? { background: `linear-gradient(135deg, ${corAcento}, #a855f7)` } : {}}
              >
                {p.nome}
              </button>
            )
          })}
        </div>
      </div>

      {/* Fontes */}
      <div>
        <label className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-2">
          <Type className="w-3 h-3" />
          Fonte
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-0.5">
          {FONTES.map(f => (
            <button
              key={f.nome}
              onClick={() => setEstilo(s => ({ ...s, fonte: f.nome }))}
              className={`px-2 py-2 rounded-lg border text-left transition-all ${
                estilo.fonte === f.nome
                  ? 'border-transparent text-white'
                  : 'border-[#1a1a2e] bg-[#0d0d1a] hover:border-[#2a2a4a]'
              }`}
              style={estilo.fonte === f.nome ? { background: `linear-gradient(135deg, ${corAcento}33, #a855f733)`, borderColor: corAcento } : {}}
            >
              <div
                className="text-xs font-bold truncate"
                style={{ fontFamily: f.css, color: estilo.fonte === f.nome ? '#fff' : '#f1f1f8' }}
              >
                {f.nome}
              </div>
              <div className="text-[9px] text-[#6b6b8a] truncate">{f.descricao}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Cores */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-2">
            <Palette className="w-3 h-3" />
            Cor do texto
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CORES.map(c => (
              <button
                key={c.hex + 'txt'}
                onClick={() => setEstilo(s => ({ ...s, cor: c.hex }))}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${
                  estilo.cor === c.hex ? 'border-white scale-110' : 'border-[#1a1a2e]'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.nome}
              />
            ))}
            <label className="w-8 h-8 rounded-lg border-2 border-dashed border-[#2a2a4a] cursor-pointer overflow-hidden relative hover:border-white" title="Custom">
              <input type="color" value={estilo.cor} onChange={e => setEstilo(s => ({ ...s, cor: e.target.value }))}
                className="absolute inset-0 opacity-0 cursor-pointer" />
              <span className="flex items-center justify-center h-full text-[10px] text-[#6b6b8a]">+</span>
            </label>
          </div>
        </div>

        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-2 block">Contorno</label>
          <div className="flex flex-wrap gap-1.5">
            {CORES.slice(0, 5).map(c => (
              <button
                key={c.hex + 'out'}
                onClick={() => setEstilo(s => ({ ...s, cor_contorno: c.hex }))}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${
                  estilo.cor_contorno === c.hex ? 'border-white scale-110' : 'border-[#1a1a2e]'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.nome}
              />
            ))}
            <label className="w-8 h-8 rounded-lg border-2 border-dashed border-[#2a2a4a] cursor-pointer overflow-hidden relative hover:border-white" title="Custom">
              <input type="color" value={estilo.cor_contorno} onChange={e => setEstilo(s => ({ ...s, cor_contorno: e.target.value }))}
                className="absolute inset-0 opacity-0 cursor-pointer" />
              <span className="flex items-center justify-center h-full text-[10px] text-[#6b6b8a]">+</span>
            </label>
          </div>
        </div>
      </div>

      {/* Animação */}
      <div>
        <label className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-2">
          <Zap className="w-3 h-3" />
          Animação
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {ANIMACOES.map(a => (
            <button
              key={a.id}
              onClick={() => setEstilo(s => ({ ...s, animacao: a.id }))}
              className={`px-2 py-2 rounded-lg border text-center transition-all ${
                estilo.animacao === a.id
                  ? 'border-transparent text-white'
                  : 'border-[#1a1a2e] bg-[#0d0d1a] text-[#9b9bb5] hover:border-[#2a2a4a]'
              }`}
              style={estilo.animacao === a.id ? { background: `linear-gradient(135deg, ${corAcento}, #a855f7)` } : {}}
            >
              <div className="text-base">{a.emoji}</div>
              <div className="text-[9px] font-semibold tracking-wider uppercase mt-0.5">{a.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tamanho + Posição + Negrito */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-2 block">Tamanho: {estilo.tamanho}%</label>
          <input
            type="range" min={30} max={100} step={5}
            value={estilo.tamanho}
            onChange={e => setEstilo(s => ({ ...s, tamanho: Number(e.target.value) }))}
            className="w-full accent-accent-pink"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-2">
            <AlignVerticalSpaceAround className="w-3 h-3" />
            Posição
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(['alto','centro','baixo'] as const).map(p => (
              <button
                key={p}
                onClick={() => setEstilo(s => ({ ...s, posicao: p }))}
                className={`py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${
                  estilo.posicao === p
                    ? 'text-white'
                    : 'bg-[#0d0d1a] border border-[#1a1a2e] text-[#9b9bb5]'
                }`}
                style={estilo.posicao === p ? { background: `linear-gradient(135deg, ${corAcento}, #a855f7)` } : {}}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-[#9b9bb5] cursor-pointer select-none">
        <input type="checkbox" checked={estilo.negrito} onChange={e => setEstilo(s => ({ ...s, negrito: e.target.checked }))}
          className="w-4 h-4 rounded accent-accent-pink" />
        <Bold className="w-3 h-3" />
        Negrito
      </label>

      {/* Erro */}
      {erro && (
        <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-sm">{erro}</div>
      )}

      {/* Ações */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1a1a2e]">
        <button
          onClick={() => baixar('srt')}
          disabled={!!baixando}
          className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-[#f1f1f8] border border-[#2a2a4a] bg-[#13131f] hover:border-white/20 transition-colors disabled:opacity-40"
        >
          {baixando === 'srt' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Baixar .SRT <span className="text-[9px] text-[#6b6b8a]">(universal)</span>
        </button>
        <button
          onClick={() => baixar('ass')}
          disabled={!!baixando}
          className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${corAcento}, #a855f7)` }}
        >
          {baixando === 'ass' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Baixar .ASS <span className="text-[9px] opacity-80">(estilizado)</span>
        </button>
      </div>
      <p className="text-[11px] text-[#5a5a7a] leading-relaxed">
        <strong className="text-[#9b9bb5]">Importar no CapCut:</strong> abra o projeto → toca em "Texto" → "Legenda" → ícone de importar → seleciona o arquivo. O .ASS preserva fontes e animações; .SRT é universal (Premiere, InShot, DaVinci).
      </p>
    </div>
  )
}
