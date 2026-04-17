'use client'

import { useState, useRef, useEffect } from 'react'
import {
  FileText,
  Sparkles,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  Zap,
  Target,
  Play,
  User,
  Layers,
  Radio,
  History,
} from 'lucide-react'
import Link from 'next/link'
import { InstagramIcon, TikTokIcon, YouTubeIcon } from '@/components/platform-icons'
import { HistoricoPanel, salvarHistorico, type HistoricoItem } from '@/components/historico-panel'

const FORMATOS = [
  { value: 'Reel (até 90s)',         iconKey: 'reel',    desc: 'Instagram / TikTok' },
  { value: 'Carrossel',              iconKey: 'carrossel', desc: 'Feed do Instagram' },
  { value: 'Vídeo longo (YouTube)',  iconKey: 'youtube', desc: 'YouTube' },
  { value: 'Stories (sequência)',    iconKey: 'stories', desc: 'Instagram / WhatsApp' },
  { value: 'Live (roteiro ao vivo)', iconKey: 'live',    desc: 'Instagram / YouTube' },
  { value: 'YouTube Shorts',        iconKey: 'shorts',  desc: 'YouTube Shorts' },
]

function FormatoIcon({ iconKey, size = 18 }: { iconKey: string; size?: number }) {
  switch (iconKey) {
    case 'reel':     return <div className="flex gap-0.5"><InstagramIcon size={size} /><TikTokIcon size={size} /></div>
    case 'carrossel':return <Layers style={{ width: size, height: size }} className="text-pink-400" />
    case 'youtube':  return <YouTubeIcon size={size} />
    case 'stories':  return <InstagramIcon size={size} />
    case 'live':     return <Radio style={{ width: size, height: size }} className="text-red-500" />
    case 'shorts':   return <YouTubeIcon size={size} />
    default:         return null
  }
}

const DURACOES = [
  '15 a 30 segundos',
  '30 a 60 segundos',
  '1 a 3 minutos',
  '3 a 7 minutos',
  '7 a 15 minutos',
  '15 a 30 minutos',
  '30+ minutos',
]

const OBJETIVOS = [
  'Educar e entregar valor',
  'Gerar engajamento (comentários/compartilhamentos)',
  'Atrair novos seguidores',
  'Vender um produto ou serviço',
  'Construir autoridade no nicho',
  'Entretenimento',
  'Gerar leads / captação',
]

type Modo = 'roteiro' | 'hooks'

export default function RoteirosPage() {
  const [tema, setTema] = useState('')
  const [formato, setFormato] = useState('')
  const [duracao, setDuracao] = useState('')
  const [estilo, setEstilo] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [modo, setModo] = useState<Modo>('roteiro')
  const [roteiro, setRoteiro] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [inspiracaoUrl, setInspiacaoUrl] = useState('')
  const [inspiracaoVideo, setInspiracaoVideo] = useState<{ titulo: string; thumbnail?: string; transcricao?: string | null; aviso?: string } | null>(null)
  const [analisandoInspiracao, setAnalisandoInspiracao] = useState(false)
  const [historicoAberto, setHistoricoAberto] = useState(false)

  // Salva no histórico quando o streaming termina
  const roteiroRef = useRef('')
  useEffect(() => { roteiroRef.current = roteiro }, [roteiro])
  useEffect(() => {
    if (!loading && roteiroRef.current.length > 100 && tema) {
      salvarHistorico('roteiro', tema, { texto: roteiroRef.current }, { formato, duracao, objetivo, modo })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!tema.trim() || !formato) return

    setLoading(true)
    setError(null)
    setRoteiro('')

    try {
      const res = await fetch('/api/roteiros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tema, formato, duracao, estilo, objetivo, modo,
          inspiracao: inspiracaoVideo
            ? { titulo: inspiracaoVideo.titulo, transcricao: inspiracaoVideo.transcricao }
            : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.mensagem || data.error || 'Erro ao gerar roteiro')
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('Stream não disponível')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setRoteiro((prev) => prev + decoder.decode(value, { stream: true }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!roteiro) return
    await navigator.clipboard.writeText(roteiro)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleAnalisarInspiracao() {
    if (!inspiracaoUrl.trim()) return
    setAnalisandoInspiracao(true)
    const res = await fetch('/api/video/analisar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: inspiracaoUrl.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      setInspiracaoVideo(data)
    }
    setAnalisandoInspiracao(false)
  }

  const hasResult = roteiro.length > 0
  const [abaAtiva, setAbaAtiva] = useState<'configurar' | 'resultado'>('configurar')

  // auto-muda para resultado quando começa a gerar
  useEffect(() => {
    if (loading) setAbaAtiva('resultado')
  }, [loading])

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-iara-400 text-sm font-medium mb-2">
          <FileText className="w-4 h-4" />
          <span>Módulo</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#f1f1f8]">
              Gerador de <span className="iara-gradient-text">Roteiros</span>
            </h1>
            <p className="mt-2 text-[#9b9bb5]">
              Descreva o tema e deixe a Iara criar um roteiro completo no seu estilo.
            </p>
          </div>
          <button
            onClick={() => setHistoricoAberto(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0f0f20] border border-[#1a1a2e] hover:border-iara-700/40 text-[#6b6b8a] hover:text-iara-400 text-xs font-medium transition-all flex-shrink-0 mt-1"
          >
            <History className="w-3.5 h-3.5" />
            Histórico
          </button>
        </div>
      </div>

      <HistoricoPanel
        tipo="roteiro"
        aberto={historicoAberto}
        onFechar={() => setHistoricoAberto(false)}
        onCarregar={(item: HistoricoItem) => {
          const c = item.conteudo as { texto: string }
          setRoteiro(c.texto)
          if (item.parametros.formato) setFormato(item.parametros.formato as string)
          if (item.parametros.duracao) setDuracao(item.parametros.duracao as string)
          if (item.parametros.objetivo) setObjetivo(item.parametros.objetivo as string)
          if (item.parametros.modo) setModo(item.parametros.modo as Modo)
          setTema(item.titulo)
        }}
      />

      {/* Abas mobile */}
      <div className="lg:hidden flex gap-1 mb-6 p-1 bg-[#0f0f1e] rounded-xl border border-[#1a1a2e]">
        {(['configurar', 'resultado'] as const).map(aba => (
          <button key={aba} onClick={() => setAbaAtiva(aba)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              abaAtiva === aba
                ? 'bg-gradient-to-r from-iara-600 to-accent-purple text-white'
                : 'text-[#5a5a7a]'
            }`}>
            {aba === 'configurar' ? '⚙ Configurar' : `✦ Resultado${hasResult ? ' ●' : ''}`}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <div className={abaAtiva === 'resultado' ? 'hidden lg:block' : ''}>
          {/* Modo toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-[#0f0f1e] rounded-xl border border-iara-900/30">
            <button
              type="button"
              onClick={() => setModo('roteiro')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                modo === 'roteiro'
                  ? 'bg-gradient-to-r from-iara-600 to-accent-purple text-white'
                  : 'text-[#9b9bb5] hover:text-[#f1f1f8]'
              }`}
            >
              <FileText className="w-4 h-4" />
              Roteiro completo
            </button>
            <button
              type="button"
              onClick={() => setModo('hooks')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                modo === 'hooks'
                  ? 'bg-gradient-to-r from-iara-600 to-accent-purple text-white'
                  : 'text-[#9b9bb5] hover:text-[#f1f1f8]'
              }`}
            >
              <Zap className="w-4 h-4" />
              4 Hooks alternativos
            </button>
          </div>

          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Tema */}
            <div>
              <label className="iara-label">
                Tema do conteúdo <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Ex: 3 erros que impedem iniciantes de emagrecer, como usar IA para produtividade, por que a maioria das startups falha no marketing..."
                rows={3}
                className="iara-input resize-none"
              />
            </div>

            {/* Formato */}
            <div>
              <label className="iara-label">
                Formato <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FORMATOS.map((f) => {
                  const active = formato === f.value
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFormato(f.value)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 ${
                        active
                          ? 'bg-iara-600/20 border-iara-600/40 text-iara-300'
                          : 'bg-[#0f0f1e] border-iara-900/40 text-[#9b9bb5] hover:border-iara-700/40 hover:text-[#f1f1f8]'
                      }`}
                    >
                      <span className="flex-shrink-0 flex items-center"><FormatoIcon iconKey={f.iconKey} size={16} /></span>
                      <div>
                        <p className="text-xs font-medium leading-tight">{f.value}</p>
                        <p className="text-[10px] text-[#5a5a7a] leading-tight">{f.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Duração — só mostra no modo roteiro */}
            {modo === 'roteiro' && (
              <div>
                <label className="iara-label">Duração aproximada</label>
                <div className="relative">
                  <select
                    value={duracao}
                    onChange={(e) => setDuracao(e.target.value)}
                    className="iara-input appearance-none pr-10 cursor-pointer"
                  >
                    <option value="">Não especificada</option>
                    {DURACOES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a7a] pointer-events-none" />
                </div>
              </div>
            )}

            {/* Objetivo */}
            <div>
              <label className="iara-label">Objetivo do conteúdo</label>
              <div className="relative">
                <select
                  value={objetivo}
                  onChange={(e) => setObjetivo(e.target.value)}
                  className="iara-input appearance-none pr-10 cursor-pointer"
                >
                  <option value="">Selecione o objetivo...</option>
                  {OBJETIVOS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a7a] pointer-events-none" />
              </div>
            </div>

            {/* Estilo adicional */}
            <div>
              <label className="iara-label">
                Observações adicionais{' '}
                <span className="text-[#5a5a7a] font-normal">(opcional)</span>
              </label>
              <textarea
                value={estilo}
                onChange={(e) => setEstilo(e.target.value)}
                placeholder="Ex: quero um tom mais provocativo, incluir uma história pessoal, focar em iniciantes..."
                rows={2}
                className="iara-input resize-none"
              />
            </div>

            {/* Vídeo de inspiração */}
            <div>
              <label className="iara-label">
                Vídeo de inspiração{' '}
                <span className="text-[#5a5a7a] font-normal">(opcional)</span>
              </label>
              {inspiracaoVideo ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0a14] border border-iara-700/30">
                  {inspiracaoVideo.thumbnail && (
                    <img src={inspiracaoVideo.thumbnail} alt="" className="w-14 h-10 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#d0d0e8] truncate">{inspiracaoVideo.titulo}</p>
                    <p className="text-[10px] mt-0.5">
                      {inspiracaoVideo.transcricao
                        ? <span className="text-green-400">transcrição extraída — IA vai aprender a estrutura</span>
                        : <span className="text-yellow-500/70">{inspiracaoVideo.aviso ?? 'sem transcrição'}</span>
                      }
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setInspiracaoVideo(null); setInspiacaoUrl('') }}
                    className="p-1.5 rounded-lg hover:bg-red-900/30 text-[#5a5a7a] hover:text-red-400 transition-colors"
                  >
                    <span className="text-xs">✕</span>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={inspiracaoUrl}
                    onChange={(e) => setInspiacaoUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAnalisarInspiracao())}
                    placeholder="Cole um link do YouTube para servir de referência de estrutura…"
                    className="iara-input flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAnalisarInspiracao}
                    disabled={analisandoInspiracao || !inspiracaoUrl.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0f0f1e] border border-[#1a1a2e] text-[#9b9bb5] text-xs hover:border-iara-700/40 transition-colors disabled:opacity-40 flex-shrink-0"
                  >
                    {analisandoInspiracao
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Analisando</>
                      : <><Play className="w-3 h-3" /> Analisar</>
                    }
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !tema.trim() || !formato}
              className="iara-btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {modo === 'hooks' ? 'Gerando hooks...' : 'Gerando roteiro...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {modo === 'hooks' ? 'Gerar 4 Hooks com IA' : 'Gerar Roteiro com IA'}
                </>
              )}
            </button>
          </form>

          {/* Perfil badge + tips */}
          <div className="mt-5 space-y-3">
            <Link
              href="/dashboard/perfil"
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-iara-700/30 bg-iara-900/20 hover:bg-iara-900/30 transition-all duration-200 group"
            >
              <div className="w-7 h-7 rounded-lg bg-iara-600/20 flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-iara-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-iara-300">A IA usa seu perfil como contexto</p>
                <p className="text-[10px] text-[#5a5a7a] truncate">Configure seu nicho e tom de voz para resultados mais personalizados →</p>
              </div>
            </Link>

            <div className="iara-card p-4 border-iara-900/20">
              <p className="text-xs font-semibold text-[#9b9bb5] mb-3 uppercase tracking-wider">
                Dicas para melhores resultados
              </p>
              <ul className="space-y-2">
                {[
                  { icon: Target, tip: 'Seja específico no tema — quanto mais detalhe, melhor o roteiro' },
                  { icon: Play, tip: 'Escolha o formato certo para a plataforma onde vai publicar' },
                  { icon: Zap, tip: 'Use "4 Hooks" para testar abordagens antes de gravar' },
                ].map(({ icon: Icon, tip }) => (
                  <li key={tip} className="flex items-start gap-2 text-xs text-[#5a5a7a]">
                    <Icon className="w-3.5 h-3.5 text-iara-500 mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className={`flex flex-col ${abaAtiva === 'configurar' ? 'hidden lg:flex' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <label className="iara-label mb-0">
              {modo === 'hooks' ? 'Hooks gerados' : 'Roteiro gerado'}
            </label>
            {hasResult && (
              <button
                onClick={handleCopy}
                className="iara-btn-secondary text-xs px-3 py-1.5"
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5 text-green-400" /> Copiado!</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copiar</>
                )}
              </button>
            )}
          </div>

          <div
            className={`flex-1 min-h-[300px] sm:min-h-[500px] rounded-2xl border transition-all duration-300 relative overflow-hidden
              ${hasResult || loading
                ? 'border-iara-700/30 bg-[#0d0d1e]'
                : 'border-dashed border-iara-900/30 bg-[#0a0a14]'
              }`}
          >
            {loading && !roteiro && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center animate-pulse-slow">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm text-[#9b9bb5]">
                  {modo === 'hooks' ? 'Iara está criando seus hooks...' : 'Iara está criando seu roteiro...'}
                </p>
                <p className="text-xs text-[#5a5a7a]">Isso pode levar alguns segundos</p>
              </div>
            )}

            {!hasResult && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-8">
                <div className="w-12 h-12 rounded-2xl bg-[#13131f] border border-iara-900/30 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#3a3a5a]" />
                </div>
                <p className="text-sm text-[#5a5a7a]">
                  Preencha o formulário e clique em{' '}
                  <span className="text-iara-400 font-medium">
                    {modo === 'hooks' ? 'Gerar 4 Hooks' : 'Gerar Roteiro'}
                  </span>{' '}
                  para ver o resultado aqui
                </p>
              </div>
            )}

            {roteiro && (
              <div className="p-6 h-full overflow-y-auto">
                <div className="prose prose-invert prose-sm max-w-none">
                  {roteiro.split('\n').map((line, i) => {
                    if (!line.trim()) return <br key={i} />

                    if (line.startsWith('###')) {
                      return (
                        <h3 key={i} className="text-sm font-bold text-iara-300 mt-5 mb-2 first:mt-0">
                          {line.replace(/^###\s*/, '')}
                        </h3>
                      )
                    }
                    if (line.startsWith('##')) {
                      return (
                        <h2 key={i} className="text-base font-bold iara-gradient-text mt-6 mb-3 first:mt-0">
                          {line.replace(/^##\s*/, '')}
                        </h2>
                      )
                    }
                    if (line.startsWith('#')) {
                      return (
                        <h1 key={i} className="text-lg font-bold text-[#f1f1f8] mb-4">
                          {line.replace(/^#\s*/, '')}
                        </h1>
                      )
                    }

                    // Bold text
                    const boldParsed = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#f1f1f8]">$1</strong>')

                    // Direções de cena entre colchetes
                    if (line.match(/^\[.+\]$/)) {
                      return (
                        <p key={i} className="text-xs text-iara-400 italic font-medium my-1">
                          {line}
                        </p>
                      )
                    }

                    return (
                      <p
                        key={i}
                        className="text-sm text-[#d0d0e8] leading-relaxed mb-1"
                        dangerouslySetInnerHTML={{ __html: boldParsed }}
                      />
                    )
                  })}
                </div>

                {loading && (
                  <span className="inline-block w-1.5 h-4 bg-iara-400 animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            )}
          </div>

          {hasResult && !loading && (
            <div className="mt-3 flex items-center gap-2 text-xs text-[#5a5a7a]">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {modo === 'hooks' ? 'Hooks gerados — escolha o melhor e grave' : 'Roteiro gerado — pronto para usar'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
