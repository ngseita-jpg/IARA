'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Download,
  Upload,
  X,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  FileText,
  Images,
  History,
  User,
  Trophy,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import type { ThumbnailLayout } from '@/app/api/thumbnail/gerar/route'
import { HistoricoPanel, salvarHistorico, type HistoricoItem } from '@/components/historico-panel'
import { BancoFotosPicker } from '@/components/banco-fotos-picker'

type Step = 'info' | 'foto' | 'gerar'
type MensagemChat = { role: 'user' | 'assistant'; content: string }

type FonteOption = {
  id: ThumbnailLayout['fonte']
  label: string
  desc: string
  exemplo: string
  family: string
  weight?: number
  italic?: boolean
  categoria: 'Impacto' | 'Sans' | 'Serif' | 'Script'
}

const FONTES: FonteOption[] = [
  // ── Impacto (títulos fortes) ──
  { id: 'bebas',            label: 'Bebas',      desc: 'YouTube clássico',  exemplo: 'IMPACTO',  family: "'Bebas Neue', sans-serif",        weight: 400, categoria: 'Impacto' },
  { id: 'anton',            label: 'Anton',      desc: 'Drama pesado',      exemplo: 'FORTE',    family: "'Anton', sans-serif",             weight: 400, categoria: 'Impacto' },
  { id: 'russo',            label: 'Russo',      desc: 'Gaming autoridade', exemplo: 'PODER',    family: "'Russo One', sans-serif",         weight: 400, categoria: 'Impacto' },
  { id: 'oswald',           label: 'Oswald',     desc: 'Tech moderno',      exemplo: 'CLEAN',    family: "'Oswald', sans-serif",            weight: 700, categoria: 'Impacto' },
  { id: 'archivo_black',    label: 'Archivo',    desc: 'Statement',         exemplo: 'BOLD',     family: "'Archivo Black', sans-serif",     weight: 400, categoria: 'Impacto' },

  // ── Sans modernas ──
  { id: 'montserrat_black', label: 'Montserrat', desc: 'Negócio sólido',    exemplo: 'Vender',   family: "'Montserrat', sans-serif",        weight: 900, categoria: 'Sans' },
  { id: 'poppins_black',    label: 'Poppins',    desc: 'Redondo acolhedor', exemplo: 'Olá',      family: "'Poppins', sans-serif",           weight: 900, categoria: 'Sans' },
  { id: 'space_grotesk',    label: 'Space',      desc: 'Tech futurista',    exemplo: 'Tech',     family: "'Space Grotesk', sans-serif",     weight: 700, categoria: 'Sans' },
  { id: 'syne',             label: 'Syne',       desc: 'Design criativo',   exemplo: 'Syne',     family: "'Syne', sans-serif",              weight: 800, categoria: 'Sans' },
  { id: 'inter',            label: 'Inter',      desc: 'Educativo',         exemplo: 'Claro',    family: "'Inter', sans-serif",             weight: 900, categoria: 'Sans' },

  // ── Serifas (editorial) ──
  { id: 'playfair',         label: 'Playfair',   desc: 'Premium serifa',    exemplo: 'Elegante', family: "'Playfair Display', serif",       weight: 700, categoria: 'Serif' },
  { id: 'playfair_italic',  label: 'Playfair It.', desc: 'Feminino chique', exemplo: 'Elegante', family: "'Playfair Display', serif",       weight: 700, italic: true, categoria: 'Serif' },
  { id: 'cormorant_italic', label: 'Cormorant',  desc: 'Delicada arte',     exemplo: 'Delicada', family: "'Cormorant Garamond', serif",     weight: 700, italic: true, categoria: 'Serif' },
  { id: 'dm_serif',         label: 'DM Serif',   desc: 'Alto contraste',    exemplo: 'Luxo',     family: "'DM Serif Display', serif",       weight: 400, categoria: 'Serif' },
  { id: 'abril',            label: 'Abril',      desc: 'Poster vintage',    exemplo: 'Vintage',  family: "'Abril Fatface', serif",          weight: 400, categoria: 'Serif' },

  // ── Script / Manuscrita ──
  { id: 'dancing',          label: 'Dancing',    desc: 'Script romântico',  exemplo: 'Querida',  family: "'Dancing Script', cursive",       weight: 700, categoria: 'Script' },
  { id: 'caveat',           label: 'Caveat',     desc: 'Manuscrita casual', exemplo: 'Anota',    family: "'Caveat', cursive",               weight: 700, categoria: 'Script' },
]

const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2' +
  '?family=Bebas+Neue' +
  '&family=Anton' +
  '&family=Russo+One' +
  '&family=Oswald:wght@700' +
  '&family=Archivo+Black' +
  '&family=Montserrat:wght@900' +
  '&family=Poppins:wght@900' +
  '&family=Space+Grotesk:wght@700' +
  '&family=Syne:wght@800' +
  '&family=Inter:wght@900' +
  '&family=Playfair+Display:ital,wght@0,700;1,700' +
  '&family=Cormorant+Garamond:ital,wght@1,700' +
  '&family=DM+Serif+Display' +
  '&family=Abril+Fatface' +
  '&family=Dancing+Script:wght@700' +
  '&family=Caveat:wght@700' +
  '&display=swap'

function resizeImage(dataUrl: string, maxDim = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

export default function ThumbnailPage() {
  const [step, setStep] = useState<Step>('info')

  // Carrega Google Fonts (apenas para preview do seletor, fontes reais do renderer vêm do public/)
  useEffect(() => {
    const existing = document.querySelector('link[data-iara-fonts]')
    if (existing) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = GOOGLE_FONTS_HREF
    link.setAttribute('data-iara-fonts', '1')
    document.head.appendChild(link)
  }, [])

  // Step 1
  const [tituloVideo, setTituloVideo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [fontePref, setFontePref] = useState<ThumbnailLayout['fonte'] | 'ia_decide'>('ia_decide')

  // Step 2
  const [imagemBase64, setImagemBase64] = useState<string | null>(null)
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Geração
  const [gerando, setGerando] = useState(false)
  const [layout, setLayout] = useState<ThumbnailLayout | null>(null)
  const [thumbnailPng, setThumbnailPng] = useState<string | null>(null)
  const [renderizando, setRenderizando] = useState(false)
  const [erroGeracao, setErroGeracao] = useState<string | null>(null)

  // Variações
  const [gerandoVariacao, setGerandoVariacao] = useState(false)
  const [variacoes, setVariacoes] = useState<{ layout: ThumbnailLayout; png: string | null }[]>([])
  const [variacaoAtiva, setVariacaoAtiva] = useState(0)

  // Chat
  const [chat, setChat] = useState<MensagemChat[]>([])
  const [msgChat, setMsgChat] = useState('')
  const [enviandoChat, setEnviandoChat] = useState(false)
  const [historicoClaude, setHistoricoClaude] = useState<{ role: string; content: string }[]>([])
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const [pontosNotif, setPontosNotif] = useState<number | null>(null)
  const [bancoAberto, setBancoAberto] = useState(false)

  // ── Upload ──────────────────────────────────────────────
  const handleFile = useCallback(async (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const raw = e.target?.result as string
      const resized = await resizeImage(raw)
      setImagemPreview(resized)
      setImagemBase64(resized)
    }
    reader.readAsDataURL(file)
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) handleFile(file)
  }

  // ── Renderizar ──────────────────────────────────────────
  async function renderizar(l: ThumbnailLayout): Promise<string | null> {
    try {
      const res = await fetch('/api/thumbnail/renderizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout: l, imagem_base64: imagemBase64 ?? undefined }),
      })
      if (!res.ok) return null
      const blob = await res.blob()
      return URL.createObjectURL(blob)
    } catch { return null }
  }

  // ── Gerar principal ──────────────────────────────────────
  async function handleGerar() {
    setGerando(true)
    setErroGeracao(null)
    setLayout(null)
    setThumbnailPng(null)
    setVariacoes([])
    setChat([])
    setHistoricoClaude([])

    try {
      const res = await fetch('/api/thumbnail/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo_video: tituloVideo,
          descricao,
          imagem_base64: imagemBase64,
          fonte_override: fontePref !== 'ia_decide' ? fontePref : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.mensagem || data.error || 'Erro ao gerar')

      const l: ThumbnailLayout = data.layout
      setLayout(l)
      setHistoricoClaude([
        { role: 'user', content: `Thumbnail: ${tituloVideo}` },
        { role: 'assistant', content: data.assistant_message },
      ])
      salvarHistorico('thumbnail', tituloVideo, l, { descricao: descricao.slice(0, 80) }).then(pts => {
        if (pts > 0) { setPontosNotif(pts); setTimeout(() => setPontosNotif(null), 3500) }
      })

      setRenderizando(true)
      const png = await renderizar(l)
      setThumbnailPng(png)
      setVariacoes([{ layout: l, png }])
      setVariacaoAtiva(0)
    } catch (e: unknown) {
      setErroGeracao(e instanceof Error ? e.message : 'Erro ao gerar thumbnail')
    } finally {
      setGerando(false)
      setRenderizando(false)
    }
  }

  // ── Gerar variação extra ──────────────────────────────────
  async function handleGerarVariacao() {
    if (!layout) return
    setGerandoVariacao(true)
    try {
      const hist = [
        ...historicoClaude,
        { role: 'user' as const, content: 'Crie uma variação completamente diferente — mude fonte, cores, posicionamento e estilo visual. Deve parecer uma thumbnail de outro criador, mas para o mesmo vídeo.' },
      ]
      const res = await fetch('/api/thumbnail/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo_video: tituloVideo,
          descricao,
          imagem_base64: imagemBase64,
          historico: hist,
          fonte_override: fontePref !== 'ia_decide' ? fontePref : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const l: ThumbnailLayout = data.layout
      const png = await renderizar(l)
      const novasVar = [...variacoes, { layout: l, png }]
      setVariacoes(novasVar)
      const idx = novasVar.length - 1
      setVariacaoAtiva(idx)
      setLayout(l)
      setThumbnailPng(png)
      setHistoricoClaude([...hist, { role: 'assistant', content: data.assistant_message }])
    } catch { /* silencioso */ }
    finally { setGerandoVariacao(false) }
  }

  // ── Chat de ajustes ──────────────────────────────────────
  async function handleEnviarChat(e: React.FormEvent) {
    e.preventDefault()
    if (!msgChat.trim() || enviandoChat) return
    const msg = msgChat
    setMsgChat('')
    setChat(prev => [...prev, { role: 'user', content: msg }])
    setEnviandoChat(true)
    try {
      const hist = [...historicoClaude, { role: 'user' as const, content: msg }]
      const res = await fetch('/api/thumbnail/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo_video: tituloVideo, descricao, imagem_base64: imagemBase64, historico: hist }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const l: ThumbnailLayout = data.layout
      setLayout(l)
      setHistoricoClaude([...hist, { role: 'assistant', content: data.assistant_message }])
      setChat(prev => [...prev, { role: 'assistant', content: l.raciocinio || 'Thumbnail atualizada!' }])
      setThumbnailPng(null)
      const png = await renderizar(l)
      setThumbnailPng(png)
      // Atualiza variação ativa
      setVariacoes(prev => {
        const nova = [...prev]
        nova[variacaoAtiva] = { layout: l, png }
        return nova
      })
    } catch {
      setChat(prev => [...prev, { role: 'assistant', content: 'Erro ao ajustar. Tente novamente.' }])
    } finally { setEnviandoChat(false) }
  }

  // ── Download ─────────────────────────────────────────────
  function handleDownload() {
    if (!thumbnailPng) return
    const a = document.createElement('a')
    a.href = thumbnailPng
    a.download = `thumb-${tituloVideo.slice(0, 20).replace(/\s+/g, '-') || 'iara'}.png`
    a.click()
  }

  // ── Steps ─────────────────────────────────────────────────
  const steps: Step[] = ['info', 'foto', 'gerar']
  const stepLabels = ['Vídeo', 'Foto', 'Gerar']
  const stepIcons = [FileText, ImageIcon, Sparkles]
  const currentStepIdx = steps.indexOf(step)

  return (
    <div className="min-h-screen bg-[#080810] text-[#f1f1f8]">
      {pontosNotif && (
        <div className="fixed top-6 right-6 z-50 animate-slide-up iara-card px-5 py-3 border-iara-700/50 shadow-2xl flex items-center gap-3">
          <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-sm font-bold text-yellow-400">+{pontosNotif} pontos!</p>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <HistoricoPanel
          tipo="thumbnail"
          aberto={historicoAberto}
          onFechar={() => setHistoricoAberto(false)}
          onCarregar={(item: HistoricoItem) => {
            const l = item.conteudo as ThumbnailLayout
            setLayout(l)
            setTituloVideo(item.titulo)
            if (item.parametros.descricao) setDescricao(item.parametros.descricao as string)
            setStep('gerar')
            setRenderizando(true)
            renderizar(l).then(png => { setThumbnailPng(png); setVariacoes([{ layout: l, png }]); setRenderizando(false) })
          }}
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-iara-400 text-sm font-medium mb-2">
            <ImageIcon className="w-4 h-4" />
            <span>Módulo</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#f1f1f8]">
                Gerador de <span className="iara-gradient-text">Thumbnail</span>
              </h1>
              <p className="mt-1 text-[#9b9bb5] text-sm">
                Design único de alto CTR — cada thumbnail é criada do zero para o seu conteúdo.
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

        {/* Step indicator */}
        <div className="mb-8">
          <div className="hidden sm:flex items-center gap-2">
            {steps.map((s, i) => {
              const Icon = stepIcons[i]
              const isActive = s === step
              const isDone = i < currentStepIdx
              return (
                <div key={s} className="flex items-center gap-2">
                  <button
                    onClick={() => isDone && setStep(s)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive ? 'bg-accent-purple/20 text-purple-300 border border-accent-purple/40'
                        : isDone ? 'text-[#9b9bb5] hover:text-purple-300 cursor-pointer'
                        : 'text-[#3a3a5a] cursor-default'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {stepLabels[i]}
                    {isDone && <CheckCircle className="w-3 h-3 text-green-400" />}
                  </button>
                  {i < steps.length - 1 && (
                    <ChevronRight className={`w-4 h-4 ${i < currentStepIdx ? 'text-accent-purple' : 'text-[#2a2a3a]'}`} />
                  )}
                </div>
              )
            })}
          </div>
          <div className="sm:hidden flex items-center gap-2 text-xs text-[#6b6b8a]">
            <span className="text-purple-300 font-medium">{stepLabels[currentStepIdx]}</span>
            <span className="text-[#4a4a6a]">· passo {currentStepIdx + 1}/3</span>
          </div>
        </div>

        {/* ═══════════ STEP 1: INFO ═══════════ */}
        {step === 'info' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[#f1f1f8] mb-1">Sobre o seu vídeo</h2>
              <p className="text-sm text-[#6b6b8a]">Quanto mais contexto, mais precisa e única será a thumbnail.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#c1c1d8] mb-2">
                Título do vídeo <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={tituloVideo}
                onChange={(e) => setTituloVideo(e.target.value)}
                placeholder="Ex: Como eu Fiz R$10.000 em 30 dias no Instagram"
                className="w-full bg-[#0f0f20] border border-[#1a1a2e] rounded-xl px-4 py-3 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-accent-purple"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#c1c1d8] mb-2">
                Contexto <span className="text-[#4a4a6a] font-normal">(recomendado)</span>
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o conteúdo, o público-alvo, a emoção que quer transmitir, se tem número/resultado específico..."
                rows={4}
                className="w-full bg-[#0f0f20] border border-[#1a1a2e] rounded-xl px-4 py-3 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-accent-purple resize-none"
              />
            </div>

            {/* Fonte preferida */}
            <div>
              <label className="block text-sm font-medium text-[#c1c1d8] mb-3">
                Fonte <span className="text-[#4a4a6a] font-normal">(ou deixa a IA escolher)</span>
              </label>

              {/* Botão IA decide */}
              <button
                onClick={() => setFontePref('ia_decide')}
                className={`w-full mb-3 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  fontePref === 'ia_decide'
                    ? 'border-iara-500 bg-iara-600/20 text-iara-200'
                    : 'border-[#1a1a2e] bg-[#0f0f20] text-[#6b6b8a] hover:border-iara-700/40'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">Deixar a IA escolher</span>
              </button>

              {/* Fontes por categoria */}
              {(['Impacto', 'Sans', 'Serif', 'Script'] as const).map(cat => (
                <div key={cat} className="mb-3 last:mb-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#4a4a6a] mb-2">{cat}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {FONTES.filter(f => f.categoria === cat).map(f => (
                      <button
                        key={f.id}
                        onClick={() => setFontePref(f.id)}
                        className={`py-3 px-3 rounded-xl border text-center transition-all ${
                          fontePref === f.id
                            ? 'border-iara-500 bg-iara-600/20 text-iara-200 ring-2 ring-iara-500/20'
                            : 'border-[#1a1a2e] bg-[#0f0f20] hover:border-iara-700/40'
                        }`}
                      >
                        <p
                          className="text-lg leading-tight mb-1 truncate"
                          style={{
                            fontFamily: f.family,
                            fontWeight: f.weight,
                            fontStyle: f.italic ? 'italic' : 'normal',
                            color: fontePref === f.id ? '#f1f1f8' : '#c1c1d8',
                          }}
                        >
                          {f.exemplo}
                        </p>
                        <p className="text-[10px] font-semibold text-[#9b9bb5] truncate">{f.label}</p>
                        <p className="text-[9px] text-[#4a4a6a] leading-tight truncate">{f.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Dicas */}
            <div className="p-4 rounded-xl bg-[#0a0a14] border border-[#1a1a2e]">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-medium text-yellow-400">O que faz uma thumbnail explodir em CTR</span>
              </div>
              <ul className="space-y-1.5">
                {[
                  'Números específicos: "R$47.320" converte mais que "muito dinheiro"',
                  'Lacuna de informação: o viewer precisa clicar para fechar a curiosidade',
                  'Rosto expressivo (surpresa/choque) aumenta CTR em 38% em média',
                  'Contraste extremo — texto legível em 3cm de tela mobile',
                ].map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#6b6b8a]">
                    <span className="text-iara-400 font-bold mt-0.5">·</span>{d}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep('foto')}
                disabled={!tituloVideo.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent-purple hover:opacity-90 disabled:opacity-40 text-white text-sm font-medium transition-all"
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 2: FOTO ═══════════ */}
        {step === 'foto' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[#f1f1f8] mb-1">Foto de fundo</h2>
              <p className="text-sm text-[#6b6b8a]">Opcional — sem foto, a IA cria um design tipográfico impactante.</p>
            </div>

            {!imagemPreview ? (
              <div className="space-y-3">
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#2a2a4a] hover:border-accent-purple/50 rounded-xl p-10 text-center cursor-pointer transition-all group"
                >
                  <Upload className="w-8 h-8 text-[#3a3a5a] group-hover:text-accent-purple mx-auto mb-3 transition-colors" />
                  <p className="text-sm text-[#6b6b8a] group-hover:text-[#9b9bb5]">
                    Arraste a foto ou <span className="text-accent-purple">clique para selecionar</span>
                  </p>
                  <p className="text-xs text-[#3a3a5a] mt-1">JPG ou PNG</p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0] || null)} />
                </div>
                <button onClick={() => setBancoAberto(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-purple-700/40 hover:border-purple-500/60 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 transition-all">
                  <Images className="w-4 h-4" />
                  Usar foto do Banco de Fotos
                </button>
              </div>
            ) : (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagemPreview} alt="Foto selecionada" className="w-full max-h-64 object-cover rounded-xl border border-[#1a1a2e]" />
                <button onClick={() => { setImagemPreview(null); setImagemBase64(null) }}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-red-600 transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-lg">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs text-white">Foto adicionada</span>
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg bg-accent-purple/10 border border-accent-purple/20">
              <p className="text-xs text-purple-300">
                <span className="font-medium">Dica pro:</span> Rosto expressivo (surpresa, empolgação)
                performa melhor que só cenário. A IA posiciona o texto para não cobrir seu rosto.
              </p>
            </div>

            <Link href="/dashboard/perfil"
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-iara-700/30 bg-iara-900/20 hover:bg-iara-900/30 transition-all group">
              <div className="w-7 h-7 rounded-lg bg-iara-600/20 flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-iara-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-iara-300">A IA usa seu perfil como contexto</p>
                <p className="text-[10px] text-[#5a5a7a]">Configure nicho e tom para designs mais personalizados →</p>
              </div>
            </Link>

            <div className="flex justify-between">
              <button onClick={() => setStep('info')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f0f20] border border-[#1a1a2e] text-[#9b9bb5] hover:text-[#f1f1f8] text-sm transition-all">
                <ChevronLeft className="w-4 h-4" />Voltar
              </button>
              <button
                onClick={() => { setStep('gerar'); handleGerar() }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-accent-purple to-iara-600 hover:opacity-90 text-white text-sm font-medium transition-all shadow-lg">
                <Sparkles className="w-4 h-4" />
                Criar thumbnail
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 3: RESULTADO ═══════════ */}
        {step === 'gerar' && (
          <div className="space-y-6">
            {/* Gerando */}
            {gerando && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple to-iara-600 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0a0a14] flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-accent-purple animate-spin" />
                  </div>
                </div>
                <p className="text-[#9b9bb5] text-sm">Criando thumbnail única de alto CTR...</p>
              </div>
            )}

            {/* Erro */}
            {erroGeracao && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-900/20 border border-red-700/30 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Erro ao gerar</p>
                  <p className="text-xs mt-0.5 text-red-400/70">
                    {erroGeracao}
                    {erroGeracao.includes('Faça upgrade') && (
                      <a href="/#planos" className="ml-1 underline text-red-300 hover:text-red-200">Ver planos →</a>
                    )}
                  </p>
                </div>
                {!erroGeracao.includes('Faça upgrade') && (
                  <button onClick={handleGerar}
                    className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-700/30 hover:bg-red-700/50 text-xs font-medium transition-all">
                    <RefreshCw className="w-3 h-3" />Tentar
                  </button>
                )}
              </div>
            )}

            {layout && !gerando && (
              <>
                {/* Estratégia */}
                <div className="p-4 rounded-xl bg-[#0f0f20] border border-accent-purple/20">
                  <p className="text-xs font-medium text-purple-400 uppercase tracking-wider mb-1">Estratégia da Iara</p>
                  <p className="text-sm text-[#9b9bb5]">{layout.raciocinio}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[#5a5a7a]">
                    <span>Fonte: <span className="text-iara-400 font-medium capitalize">{layout.fonte}</span></span>
                    <span>·</span>
                    <span>Título: <span className="text-iara-400 font-medium">{layout.tamanho_titulo}px</span></span>
                  </div>
                </div>

                {/* Thumbnail preview */}
                <div className="relative">
                  {(renderizando && !thumbnailPng) ? (
                    <div className="aspect-video rounded-xl bg-[#0f0f20] border border-[#1a1a2e] flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-accent-purple animate-spin" />
                    </div>
                  ) : thumbnailPng ? (
                    <div className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbnailPng} alt="Thumbnail" className="w-full rounded-xl border border-[#1a1a2e]" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <button onClick={handleDownload}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100">
                          <Download className="w-4 h-4" />Baixar PNG
                        </button>
                      </div>
                      <div className="absolute top-3 left-3 bg-black/60 px-2 py-1 rounded-lg text-xs text-white">1280 × 720</div>
                    </div>
                  ) : null}
                </div>

                {/* Variações */}
                {variacoes.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-[#6b6b8a] uppercase tracking-wider">Variações</p>
                      <button
                        onClick={handleGerarVariacao}
                        disabled={gerandoVariacao || variacoes.length >= 4}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-iara-700/40 hover:border-iara-500/60 text-iara-400 hover:text-iara-300 text-xs font-medium transition-all disabled:opacity-40"
                      >
                        {gerandoVariacao ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        {gerandoVariacao ? 'Gerando...' : 'Nova variação'}
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {variacoes.map((v, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setVariacaoAtiva(i)
                            setLayout(v.layout)
                            setThumbnailPng(v.png)
                          }}
                          className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                            variacaoAtiva === i ? 'border-accent-purple' : 'border-[#1a1a2e] hover:border-[#3a3a5a]'
                          }`}
                        >
                          {v.png
                            ? <img src={v.png} alt={`V${i+1}`} className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-[#0f0f20] flex items-center justify-center"><Loader2 className="w-4 h-4 text-accent-purple animate-spin" /></div>
                          }
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">V{i+1}</div>
                        </button>
                      ))}
                      {/* Slot vazio */}
                      {variacoes.length < 4 && !gerandoVariacao && (
                        <button onClick={handleGerarVariacao}
                          className="aspect-video rounded-lg border-2 border-dashed border-[#2a2a4a] hover:border-iara-700/50 flex items-center justify-center transition-all">
                          <Zap className="w-4 h-4 text-[#3a3a5a]" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Botão download */}
                {thumbnailPng && (
                  <button onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent-purple hover:opacity-90 text-white font-medium text-sm transition-all">
                    <Download className="w-4 h-4" />
                    Baixar thumbnail (PNG 1280×720)
                  </button>
                )}

                {/* Chat */}
                <div>
                  <h3 className="text-sm font-semibold text-[#c1c1d8] mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent-purple" />
                    Ajustar com a Iara
                  </h3>
                  {chat.length > 0 && (
                    <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                      {chat.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                            msg.role === 'user'
                              ? 'bg-accent-purple/20 text-purple-100 border border-accent-purple/20'
                              : 'bg-[#0f0f20] text-[#c1c1d8] border border-[#1a1a2e]'
                          }`}>{msg.content}</div>
                        </div>
                      ))}
                      {enviandoChat && (
                        <div className="flex justify-start">
                          <div className="bg-[#0f0f20] border border-[#1a1a2e] px-3 py-2 rounded-lg">
                            <Loader2 className="w-4 h-4 text-accent-purple animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {chat.length === 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {['Deixa o título mais curto', 'Muda para fonte Bebas', 'Coloca badge de número', 'Testa fundo mais escuro'].map(s => (
                        <button key={s} onClick={() => setMsgChat(s)}
                          className="px-3 py-1.5 rounded-lg bg-[#0f0f20] border border-[#1a1a2e] text-xs text-[#9b9bb5] hover:border-accent-purple/40 hover:text-purple-300 transition-all">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <form onSubmit={handleEnviarChat} className="flex gap-2">
                    <input type="text" value={msgChat} onChange={(e) => setMsgChat(e.target.value)}
                      placeholder="Ex: Coloca GRATUITO em vermelho, muda para fundo escuro..."
                      className="flex-1 bg-[#0f0f20] border border-[#1a1a2e] rounded-xl px-4 py-2.5 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-accent-purple" />
                    <button type="submit" disabled={!msgChat.trim() || enviandoChat}
                      className="px-4 py-2.5 rounded-xl bg-accent-purple hover:opacity-90 disabled:opacity-40 text-white">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* Nova thumbnail */}
                <div className="flex justify-center pt-4 border-t border-[#1a1a2e]">
                  <button
                    onClick={() => { setStep('info'); setLayout(null); setThumbnailPng(null); setChat([]); setHistoricoClaude([]); setTituloVideo(''); setDescricao(''); setImagemBase64(null); setImagemPreview(null); setVariacoes([]) }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f0f20] border border-[#1a1a2e] text-[#9b9bb5] hover:text-[#f1f1f8] text-sm transition-all">
                    <RefreshCw className="w-4 h-4" />Criar nova thumbnail
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {bancoAberto && (
        <BancoFotosPicker
          onClose={() => setBancoAberto(false)}
          onConfirm={(dataUrls) => {
            const url = dataUrls[0]
            if (url) { setImagemPreview(url); setImagemBase64(url) }
            setBancoAberto(false)
          }}
        />
      )}
    </div>
  )
}
