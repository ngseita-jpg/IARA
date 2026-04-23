'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Scissors, Loader2, AlertCircle, Youtube, Clock,
  Sparkles, Play, Hash, Star, ChevronRight, FileText, Copy,
} from 'lucide-react'
import { LegendaEditor } from './legenda-editor'

type Trecho = {
  id?: string
  ordem: number
  titulo: string
  descricao: string
  hook: string
  inicio_segundos: number
  fim_segundos: number
  plataforma_ideal: 'reels' | 'shorts' | 'tiktok' | 'feed' | 'linkedin'
  hashtags: string[]
  transcricao_trecho: string
  score_qualidade: number
  inicio_formatado?: string
  fim_formatado?: string
  duracao_formatada?: string
}

type VideoInfo = {
  id: string
  video_id: string
  url_original: string
  duracao_segundos: number
}

const PLATAFORMAS: Record<Trecho['plataforma_ideal'], { label: string; emoji: string; bg: string }> = {
  reels:    { label: 'Instagram Reels', emoji: '📸', bg: 'linear-gradient(135deg,#833AB4,#E1306C)' },
  shorts:   { label: 'YouTube Shorts',  emoji: '▶️', bg: 'linear-gradient(135deg,#FF0000,#C80000)' },
  tiktok:   { label: 'TikTok',          emoji: '🎵', bg: 'linear-gradient(135deg,#25F4EE,#FE2C55)' },
  feed:     { label: 'Feed Insta',      emoji: '🖼️', bg: 'linear-gradient(135deg,#833AB4,#F77737)' },
  linkedin: { label: 'LinkedIn',        emoji: '💼', bg: 'linear-gradient(135deg,#0077B5,#005582)' },
}

type Props = {
  modo: 'criador' | 'marca'
  corAcento: string             // '#ec4899' criador, '#a855f7' marca
  tituloDestaque?: string       // '#E2C068' dourado padrão
  planosLink: string            // '/#planos' ou '/empresas#planos'
}

export function CortesPage({ modo, corAcento, tituloDestaque = '#E2C068', planosLink }: Props) {
  const [url, setUrl] = useState('')
  const [numCortes, setNumCortes] = useState(6)
  const [analisando, setAnalisando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [video, setVideo] = useState<VideoInfo | null>(null)
  const [trechos, setTrechos] = useState<Trecho[]>([])
  const [trechoSelecionado, setTrechoSelecionado] = useState<Trecho | null>(null)
  const [historico, setHistorico] = useState<{ id: string; video_id: string; titulo: string | null; created_at: string; status: string }[]>([])

  const carregarHistorico = useCallback(async () => {
    const res = await fetch('/api/cortes/lista')
    if (res.ok) {
      const d = await res.json()
      setHistorico(d.videos ?? [])
    }
  }, [])

  useEffect(() => { carregarHistorico() }, [carregarHistorico])

  async function carregarVideo(videoId: string) {
    const res = await fetch(`/api/cortes/${videoId}`)
    if (!res.ok) return
    const d = await res.json()
    setVideo({
      id: d.video.id,
      video_id: d.video.video_id,
      url_original: d.video.url_original,
      duracao_segundos: d.video.duracao_segundos,
    })
    setTrechos(d.trechos ?? [])
  }

  async function analisar() {
    if (!url.trim()) {
      setErro('Cola um link do YouTube')
      return
    }
    setAnalisando(true); setErro(null); setTrechoSelecionado(null); setTrechos([]); setVideo(null)
    try {
      const res = await fetch('/api/cortes/analisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, modo, num_cortes: numCortes }),
      })
      const d = await res.json()
      if (!res.ok) {
        setErro(d.error ?? d.mensagem ?? 'Erro ao analisar')
        return
      }
      setVideo(d.video)
      // Re-busca via GET pra pegar IDs reais do DB
      await carregarVideo(d.video.id)
      carregarHistorico()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro de conexão')
    } finally {
      setAnalisando(false)
    }
  }

  function copiarHashtags(trecho: Trecho) {
    navigator.clipboard.writeText(trecho.hashtags.join(' '))
  }

  function copiarLegendaCompleta(trecho: Trecho) {
    const texto = `${trecho.hook}\n\n${trecho.descricao}\n\n${trecho.hashtags.join(' ')}`
    navigator.clipboard.writeText(texto)
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-semibold tracking-[0.2em] uppercase mb-3"
          style={{ borderColor: `${corAcento}4D`, backgroundColor: `${corAcento}1A`, color: corAcento }}
        >
          <Scissors className="w-3 h-3" />
          Iara Cortes · YouTube → Shorts/Reels/TikTok
        </div>
        <h1 className="font-display font-black text-[clamp(28px,4vw,40px)] leading-tight tracking-display mb-2">
          Transforma vídeos longos{' '}
          <span className="font-editorial font-normal" style={{ color: tituloDestaque }}>em 6 cortes virais</span>
        </h1>
        <p className="text-[#9b9bb5] max-w-2xl text-[15px]">
          Cola o link do YouTube, a Iara lê a transcrição e te entrega os melhores momentos já separados por timestamp, com hook, legenda animada, hashtags e plataforma ideal. Importa direto no CapCut.
        </p>
      </div>

      {/* Input */}
      <div className="rounded-2xl border border-[#1a1a2e] bg-[#0d0d1a]/80 p-5 sm:p-7 mb-6 space-y-4">
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-2">Link do vídeo do YouTube</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] pl-11 pr-3 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:outline-none"
                style={{ borderColor: url ? corAcento + '66' : undefined }}
                disabled={analisando}
                onKeyDown={e => { if (e.key === 'Enter') analisar() }}
              />
            </div>
            <select
              value={numCortes}
              onChange={e => setNumCortes(Number(e.target.value))}
              disabled={analisando}
              className="rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-3 py-3 text-sm text-[#f1f1f8] focus:outline-none"
            >
              <option value={4}>4 cortes</option>
              <option value={6}>6 cortes</option>
              <option value={8}>8 cortes</option>
              <option value={10}>10 cortes</option>
              <option value={12}>12 cortes</option>
            </select>
            <button
              onClick={analisar}
              disabled={analisando || !url.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 hover:opacity-90 whitespace-nowrap"
              style={{ background: `linear-gradient(135deg, ${corAcento}, #a855f7, #6366f1)` }}
            >
              {analisando ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando...</>
                : <><Sparkles className="w-4 h-4" /> Gerar cortes</>}
            </button>
          </div>
          <p className="text-[10px] text-[#5a5a7a] mt-1.5">
            Funciona com vídeos públicos que têm legenda no YouTube. Recomendado: vídeos de 5min a 2h. Primeira análise leva ~30s.
          </p>
        </div>

        {erro && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {erro}
              {(erro.includes('Limite') || erro.includes('limite') || erro.includes('plano')) && (
                <Link href={planosLink} className="ml-2 underline text-red-300 font-semibold">Ver planos</Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading state com skeleton */}
      {analisando && !trechos.length && (
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0d0d1a]/60 p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: corAcento }} />
            <div>
              <p className="text-sm font-semibold text-[#f1f1f8]">Iara analisando vídeo...</p>
              <p className="text-xs text-[#6b6b8a]">Baixando transcrição → identificando melhores momentos → gerando cortes</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[#1a1a2e] bg-[#08080f] aspect-[4/5] animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Trecho selecionado — painel detalhado */}
      {trechoSelecionado && video && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-5xl my-8 rounded-2xl border border-[#1a1a2e] bg-[#0a0a14] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#1a1a2e] sticky top-0 bg-[#0a0a14] z-10">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0"
                  style={{ background: PLATAFORMAS[trechoSelecionado.plataforma_ideal].bg, color: '#fff' }}
                >
                  {PLATAFORMAS[trechoSelecionado.plataforma_ideal].emoji}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#f1f1f8] text-sm sm:text-base truncate">{trechoSelecionado.titulo}</h3>
                  <p className="text-[11px] text-[#6b6b8a]">
                    Corte {trechoSelecionado.ordem} · {trechoSelecionado.inicio_formatado ?? fmtTempoLocal(trechoSelecionado.inicio_segundos)} → {trechoSelecionado.fim_formatado ?? fmtTempoLocal(trechoSelecionado.fim_segundos)}
                  </p>
                </div>
              </div>
              <button onClick={() => setTrechoSelecionado(null)} className="p-2 rounded-lg hover:bg-white/5 text-[#9b9bb5]">
                ✕
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-5 p-5">
              {/* Esquerda — info + ações */}
              <div className="space-y-4">
                <a
                  href={`https://www.youtube.com/watch?v=${video.video_id}&t=${Math.floor(trechoSelecionado.inicio_segundos)}s`}
                  target="_blank"
                  rel="noopener"
                  className="block relative rounded-xl overflow-hidden border border-[#1a1a2e] group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`}
                    alt="Thumb"
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-bold text-sm">
                      <Play className="w-4 h-4" />
                      Assistir do minuto {trechoSelecionado.inicio_formatado ?? fmtTempoLocal(trechoSelecionado.inicio_segundos)}
                    </div>
                  </div>
                </a>

                <div className="rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] p-4 space-y-3">
                  <div>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-[#6b6b8a] font-semibold mb-1">Hook</p>
                    <p className="text-sm font-bold text-[#f1f1f8] leading-snug">&ldquo;{trechoSelecionado.hook}&rdquo;</p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-[#6b6b8a] font-semibold mb-1">Descrição</p>
                    <p className="text-xs text-[#c1c1d8] leading-relaxed">{trechoSelecionado.descricao}</p>
                  </div>
                  {trechoSelecionado.transcricao_trecho && (
                    <div>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-[#6b6b8a] font-semibold mb-1">O que é falado</p>
                      <p className="text-xs text-[#9b9bb5] leading-relaxed italic">{trechoSelecionado.transcricao_trecho}</p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-[#1a1a2e] bg-[#0d0d1a] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-[#6b6b8a] font-semibold flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      Hashtags
                    </p>
                    <button onClick={() => copiarHashtags(trechoSelecionado)}
                      className="text-[10px] text-[#9b9bb5] hover:text-white flex items-center gap-1">
                      <Copy className="w-3 h-3" /> Copiar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {trechoSelecionado.hashtags.map((h, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-[#1a1a2e] text-[#c1c1d8]">{h}</span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => copiarLegendaCompleta(trechoSelecionado)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#2a2a4a] bg-[#13131f] text-sm font-semibold text-[#f1f1f8] hover:border-white/20"
                >
                  <FileText className="w-4 h-4" />
                  Copiar legenda pronta (hook + descrição + hashtags)
                </button>
              </div>

              {/* Direita — editor de legenda */}
              <div>
                <div className="sticky top-20">
                  <div className="mb-3">
                    <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a]">Editor de legenda animada</p>
                    <p className="text-xs text-[#9b9bb5] mt-0.5">Escolhe estilo, baixa .SRT ou .ASS e importa no CapCut/Premiere.</p>
                  </div>
                  {trechoSelecionado.id && (
                    <LegendaEditor
                      trechoId={trechoSelecionado.id}
                      videoId={video.id}
                      textoPreview={trechoSelecionado.hook || trechoSelecionado.titulo}
                      corAcento={corAcento}
                    />
                  )}
                  {!trechoSelecionado.id && (
                    <p className="text-xs text-[#6b6b8a] italic">Reabra esse corte pelo histórico pra editar a legenda.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid de trechos */}
      {trechos.length > 0 && video && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase font-semibold" style={{ color: corAcento }}>
                {trechos.length} cortes gerados
              </p>
              <p className="text-xs text-[#6b6b8a] mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Vídeo original: {fmtDuracao(video.duracao_segundos)}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trechos.map(trecho => (
              <button
                key={trecho.id ?? trecho.ordem}
                onClick={() => setTrechoSelecionado(trecho)}
                className="text-left rounded-2xl border border-[#1a1a2e] bg-[#0d0d1a]/80 overflow-hidden hover:border-white/20 transition-all group cursor-pointer"
              >
                {/* Thumb */}
                <div className="relative aspect-video bg-[#08080f]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                    alt=""
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white">
                    <Play className="w-2.5 h-2.5" />
                    {trecho.inicio_formatado ?? fmtTempoLocal(trecho.inicio_segundos)} → {trecho.fim_formatado ?? fmtTempoLocal(trecho.fim_segundos)}
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-white shadow-lg"
                    style={{ background: PLATAFORMAS[trecho.plataforma_ideal].bg }}>
                    {PLATAFORMAS[trecho.plataforma_ideal].emoji} {PLATAFORMAS[trecho.plataforma_ideal].label}
                  </div>
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-bold text-[#E2C068]">
                    <Star className="w-2.5 h-2.5 fill-[#E2C068]" />
                    {trecho.score_qualidade}
                  </div>
                </div>

                <div className="p-3">
                  <p className="text-[9px] uppercase tracking-widest text-[#5a5a7a] mb-1">Corte #{trecho.ordem} · {trecho.duracao_formatada ?? fmtTempoLocal(trecho.fim_segundos - trecho.inicio_segundos)}</p>
                  <h3 className="font-display font-bold text-sm text-[#f1f1f8] mb-1.5 line-clamp-2 leading-tight">{trecho.titulo}</h3>
                  <p className="text-[11px] text-[#9b9bb5] leading-relaxed line-clamp-2 italic">&ldquo;{trecho.hook}&rdquo;</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                      {trecho.hashtags.slice(0, 2).map((h, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-[#1a1a2e] text-[#6b6b8a] truncate">{h}</span>
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold flex items-center gap-0.5 ml-2" style={{ color: corAcento }}>
                      Abrir <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#1a1a2e]/30 to-[#0d0d1a]/30 border border-[#1a1a2e]">
            <p className="text-xs text-[#9b9bb5] leading-relaxed">
              <strong className="text-[#f1f1f8]">Próximos passos:</strong> Clique em cada corte, personalize a legenda animada e baixe o arquivo .ASS ou .SRT.
              Importa no <strong>CapCut</strong> (Texto → Legenda → Importar) ou <strong>InShot / Premiere / DaVinci</strong>.
              O corte do vídeo em si você faz no próprio CapCut colando o intervalo informado.
            </p>
          </div>
        </>
      )}

      {/* Histórico */}
      {historico.length > 0 && !trechos.length && !analisando && (
        <div className="mt-10">
          <p className="text-[11px] tracking-[0.3em] uppercase font-semibold text-[#6b6b8a] mb-3">Histórico</p>
          <div className="space-y-2">
            {historico.slice(0, 10).map(h => (
              <button
                key={h.id}
                onClick={() => carregarVideo(h.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#1a1a2e] bg-[#0d0d1a]/60 hover:border-white/20 transition-all text-left group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${h.video_id}/default.jpg`}
                  alt=""
                  className="w-20 h-14 object-cover rounded-lg shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#f1f1f8] truncate">{h.titulo ?? `Vídeo YouTube (${h.video_id})`}</p>
                  <p className="text-[11px] text-[#6b6b8a]">
                    {new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} · {h.status === 'pronto' ? '✓ Pronto' : h.status === 'processando' ? '⏳ Processando' : '⚠ Falhou'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5a5a7a] group-hover:text-white" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {trechos.length === 0 && !analisando && historico.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#1a1a2e] bg-[#0d0d1a]/40 p-10 text-center">
          <Scissors className="w-10 h-10 text-[#3a3a5a] mx-auto mb-3" />
          <p className="text-[#6b6b8a] text-sm mb-1">Ainda não analisou nenhum vídeo</p>
          <p className="text-[#5a5a7a] text-xs">Cola um link do YouTube acima e a Iara faz o resto.</p>
        </div>
      )}
    </div>
  )
}

function fmtTempoLocal(seg: number): string {
  const s = Math.max(0, Math.floor(seg))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

function fmtDuracao(seg: number): string {
  const h = Math.floor(seg / 3600)
  const m = Math.floor((seg % 3600) / 60)
  const s = Math.floor(seg % 60)
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}min` : `${m}min${String(s).padStart(2, '0')}s`
}

