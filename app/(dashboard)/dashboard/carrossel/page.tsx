'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Layers,
  Link as LinkIcon,
  Type,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Download,
  ChevronRight,
  ChevronLeft,
  Send,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Play,
  FileText,
  Sliders,
  Newspaper,
  History,
  User,
  Trophy,
  Images,
} from 'lucide-react'
import Link from 'next/link'
import { YouTubeIcon, TikTokIcon, InstagramIcon } from '@/components/platform-icons'
import type { CarrosselData, Slide } from '@/app/api/carrossel/gerar/route'
import { HistoricoPanel, salvarHistorico, type HistoricoItem } from '@/components/historico-panel'
import { BancoFotosPicker } from '@/components/banco-fotos-picker'

type Step = 'conteudo' | 'imagens' | 'config' | 'preview'

type MensagemChat = {
  role: 'user' | 'assistant'
  content: string
}

type LeituraConteudo = {
  titulo: string
  conteudo: string
  plataforma: string
  tipo: string
  aviso?: string
}

export default function CarrosselPage() {
  // Steps
  const [step, setStep] = useState<Step>('conteudo')

  // Step 1: conteúdo
  const [modoConteudo, setModoConteudo] = useState<'url' | 'texto'>('url')
  const [url, setUrl] = useState('')
  const [textoManual, setTextoManual] = useState('')
  const [leitura, setLeitura] = useState<LeituraConteudo | null>(null)
  const [lendo, setLendo] = useState(false)
  const [erroLeitura, setErroLeitura] = useState<string | null>(null)

  // Step 2: imagens
  const [imagens, setImagens] = useState<string[]>([]) // base64
  const [imagensPreview, setImagensPreview] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 3: config
  const [numSlides, setNumSlides] = useState(6)
  const [instrucoes, setInstrucoes] = useState('')

  // Step 4: preview + geração
  const [gerando, setGerando] = useState(false)
  const [carrossel, setCarrossel] = useState<CarrosselData | null>(null)
  const [slidePngs, setSlidePngs] = useState<Record<number, string>>({}) // ordem -> dataURL
  const [renderizando, setRenderizando] = useState<Record<number, boolean>>({})
  const [erroGeracao, setErroGeracao] = useState<string | null>(null)

  // Chat de ajustes
  const [chat, setChat] = useState<MensagemChat[]>([])
  const [msgChat, setMsgChat] = useState('')
  const [enviandoChat, setEnviandoChat] = useState(false)
  const [historicoClaude, setHistoricoClaude] = useState<{ role: string; content: string }[]>([])
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const [pontosNotif, setPontosNotif] = useState<number | null>(null)
  const [bancoAberto, setBancoAberto] = useState(false)

  // ───────────────────────────────────────────
  // Step 1: ler URL
  // ───────────────────────────────────────────
  async function handleLerUrl() {
    if (!url.trim()) return
    setLendo(true)
    setErroLeitura(null)
    setLeitura(null)

    try {
      const res = await fetch('/api/carrossel/ler-conteudo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao ler URL')
      setLeitura(data)
    } catch (e: unknown) {
      setErroLeitura(e instanceof Error ? e.message : 'Erro ao ler URL')
    } finally {
      setLendo(false)
    }
  }

  // ───────────────────────────────────────────
  // Step 2: upload de imagens
  // ───────────────────────────────────────────
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const novos: string[] = []
    const novosPreview: string[] = []
    let pendentes = files.length

    Array.from(files).slice(0, 8 - imagens.length).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        novos.push(result.replace(/^data:image\/\w+;base64,/, ''))
        novosPreview.push(result)
        pendentes--
        if (pendentes === 0) {
          setImagens((prev) => [...prev, ...novos])
          setImagensPreview((prev) => [...prev, ...novosPreview])
        }
      }
      reader.readAsDataURL(file)
    })
  }, [imagens.length])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  function removerImagem(idx: number) {
    setImagens((prev) => prev.filter((_, i) => i !== idx))
    setImagensPreview((prev) => prev.filter((_, i) => i !== idx))
  }

  // ───────────────────────────────────────────
  // Step 4: gerar carrossel
  // ───────────────────────────────────────────
  async function handleGerar() {
    setGerando(true)
    setErroGeracao(null)
    setCarrossel(null)
    setSlidePngs({})

    const conteudo = modoConteudo === 'url'
      ? (leitura?.conteudo || textoManual || url)
      : textoManual

    try {
      const res = await fetch('/api/carrossel/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conteudo,
          instrucoes,
          num_slides: numSlides,
          imagens_base64: imagens.length > 0 ? imagens : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.mensagem || data.error || 'Erro ao gerar')

      const carrosselGerado: CarrosselData = data.carrossel
      setCarrossel(carrosselGerado)
      setHistoricoClaude([
        { role: 'user', content: `Gerei um carrossel sobre: ${conteudo.slice(0, 200)}` },
        { role: 'assistant', content: data.assistant_message },
      ])
      const tituloHistorico = leitura?.titulo || textoManual.slice(0, 80) || url
      salvarHistorico('carrossel', tituloHistorico, carrosselGerado, { numSlides, instrucoes: instrucoes.slice(0, 60) }).then(pts => {
        if (pts > 0) { setPontosNotif(pts); setTimeout(() => setPontosNotif(null), 3500) }
      })

      // Renderizar slides em paralelo
      await renderizarTodos(carrosselGerado)
    } catch (e: unknown) {
      setErroGeracao(e instanceof Error ? e.message : 'Erro ao gerar carrossel')
    } finally {
      setGerando(false)
    }
  }

  async function renderizarTodos(c: CarrosselData) {
    const promises = c.slides.map((slide) => renderizarSlide(slide, c))
    await Promise.all(promises)
  }

  async function renderizarSlide(slide: Slide, c: CarrosselData) {
    setRenderizando((prev) => ({ ...prev, [slide.ordem]: true }))

    const imgBase64 = slide.imagem_index !== undefined && imagens[slide.imagem_index]
      ? `data:image/jpeg;base64,${imagens[slide.imagem_index]}`
      : undefined

    try {
      const res = await fetch('/api/carrossel/renderizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slide,
          imagem_base64: imgBase64,
          paleta: c.paleta,
          total_slides: c.slides.length,
        }),
      })

      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setSlidePngs((prev) => ({ ...prev, [slide.ordem]: url }))
    } catch {
      // silencioso
    } finally {
      setRenderizando((prev) => ({ ...prev, [slide.ordem]: false }))
    }
  }

  // ───────────────────────────────────────────
  // Chat de ajustes
  // ───────────────────────────────────────────
  async function handleEnviarChat(e: React.FormEvent) {
    e.preventDefault()
    if (!msgChat.trim() || enviandoChat) return

    const novaMensagem = msgChat
    setMsgChat('')
    setChat((prev) => [...prev, { role: 'user', content: novaMensagem }])
    setEnviandoChat(true)

    const conteudo = modoConteudo === 'url'
      ? (leitura?.conteudo || textoManual || url)
      : textoManual

    try {
      const novoHistorico = [
        ...historicoClaude,
        { role: 'user' as const, content: novaMensagem },
      ]

      const res = await fetch('/api/carrossel/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conteudo,
          instrucoes,
          num_slides: carrossel?.slides.length ?? numSlides,
          imagens_base64: imagens.length > 0 ? imagens : undefined,
          historico: novoHistorico,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const carrosselAtualizado: CarrosselData = data.carrossel
      setCarrossel(carrosselAtualizado)
      setHistoricoClaude([...novoHistorico, { role: 'assistant', content: data.assistant_message }])
      setChat((prev) => [...prev, { role: 'assistant', content: carrosselAtualizado.raciocinio || 'Carrossel atualizado!' }])

      setSlidePngs({})
      await renderizarTodos(carrosselAtualizado)
    } catch (e: unknown) {
      setChat((prev) => [...prev, { role: 'assistant', content: 'Erro ao ajustar. Tente novamente.' }])
    } finally {
      setEnviandoChat(false)
    }
  }

  // ───────────────────────────────────────────
  // Download
  // ───────────────────────────────────────────
  function downloadSlide(ordem: number) {
    const url = slidePngs[ordem]
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `slide-${ordem}.png`
    a.click()
  }

  function downloadTodos() {
    Object.entries(slidePngs).forEach(([ordem, url]) => {
      const a = document.createElement('a')
      a.href = url
      a.download = `slide-${ordem}.png`
      a.click()
    })
  }

  // ───────────────────────────────────────────
  // Navegação entre steps
  // ───────────────────────────────────────────
  const steps: Step[] = ['conteudo', 'imagens', 'config', 'preview']
  const stepLabels = ['Conteúdo', 'Imagens', 'Configurar', 'Gerar']
  const stepIcons = [FileText, ImageIcon, Sliders, Sparkles]
  const currentStepIdx = steps.indexOf(step)

  function podeProsseguir() {
    if (step === 'conteudo') {
      if (modoConteudo === 'texto') return !!textoManual.trim()
      // modo URL: precisa de conteúdo extraído OU texto manual colado (fallback)
      return !!(leitura?.conteudo || textoManual.trim())
    }
    return true
  }

  return (
    <div className="min-h-screen bg-[#080810] text-[#f1f1f8]">
      {/* Notificação de pontos */}
      {pontosNotif && (
        <div className="fixed top-6 right-6 z-50 animate-slide-up iara-card px-5 py-3 border-iara-700/50 shadow-2xl flex items-center gap-3">
          <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-sm font-bold text-yellow-400">+{pontosNotif} pontos!</p>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">

        <HistoricoPanel
          tipo="carrossel"
          aberto={historicoAberto}
          onFechar={() => setHistoricoAberto(false)}
          onCarregar={(item: HistoricoItem) => {
            const c = item.conteudo as CarrosselData
            setCarrossel(c)
            setSlidePngs({})
            setStep('preview')
          }}
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-iara-400 text-sm font-medium mb-2">
            <Layers className="w-4 h-4" />
            <span>Módulo</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#f1f1f8]">
                Gerador de <span className="iara-gradient-text">Carrossel</span>
              </h1>
              <p className="mt-1 text-[#9b9bb5] text-sm">
                Cole um link, texto ou vídeo — a Iara monta o carrossel por você.
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

        {/* Step indicator — mobile: numbered circles, desktop: labeled buttons */}
        <div className="mb-8">
          {/* Mobile compact */}
          <div className="flex items-center sm:hidden mb-2">
            {steps.map((s, i) => {
              const isActive = s === step
              const isDone = i < currentStepIdx
              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => isDone && setStep(s)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-all ${
                      isActive
                        ? 'bg-iara-600 text-white ring-2 ring-iara-500/30'
                        : isDone
                        ? 'bg-green-600/30 text-green-400 cursor-pointer'
                        : 'bg-[#1a1a2e] text-[#4a4a6a]'
                    }`}
                  >
                    {isDone ? '✓' : i + 1}
                  </button>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-px mx-1 ${i < currentStepIdx ? 'bg-iara-600/60' : 'bg-[#2a2a4a]'}`} />
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-[#6b6b8a] sm:hidden">
            <span className="text-iara-300 font-medium">{stepLabels[currentStepIdx]}</span>
            <span className="ml-1 text-[#4a4a6a]">· passo {currentStepIdx + 1} de {steps.length}</span>
          </p>

          {/* Desktop full labels */}
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
                      isActive
                        ? 'bg-iara-600/30 text-iara-300 border border-iara-600/40'
                        : isDone
                        ? 'text-[#9b9bb5] hover:text-iara-300 cursor-pointer'
                        : 'text-[#3a3a5a] cursor-default'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {stepLabels[i]}
                    {isDone && <CheckCircle className="w-3 h-3 text-green-400" />}
                  </button>
                  {i < steps.length - 1 && (
                    <ChevronRight className={`w-4 h-4 ${i < currentStepIdx ? 'text-iara-600' : 'text-[#2a2a3a]'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════ */}
        {/* STEP 1: CONTEÚDO */}
        {/* ═══════════════════════════════════ */}
        {step === 'conteudo' && (
          <div className="space-y-6">
            {/* Modo selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setModoConteudo('url')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  modoConteudo === 'url'
                    ? 'bg-iara-600/20 text-iara-300 border border-iara-600/30'
                    : 'bg-[#0f0f20] text-[#9b9bb5] border border-[#1a1a2e] hover:border-iara-700/30'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                Colar link
              </button>
              <button
                onClick={() => setModoConteudo('texto')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  modoConteudo === 'texto'
                    ? 'bg-iara-600/20 text-iara-300 border border-iara-600/30'
                    : 'bg-[#0f0f20] text-[#9b9bb5] border border-[#1a1a2e] hover:border-iara-700/30'
                }`}
              >
                <Type className="w-4 h-4" />
                Digitar texto
              </button>
            </div>

            {/* URL input */}
            {modoConteudo === 'url' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#0f0f20] border border-[#1a1a2e]">
                  <p className="text-xs text-[#6b6b8a] mb-3">
                    Cole o link de um artigo, vídeo do YouTube, TikTok ou Instagram — a Iara lê o conteúdo pra você.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setLeitura(null); setErroLeitura(null) }}
                      placeholder="https://youtube.com/watch?v=... ou link de artigo"
                      className="flex-1 bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg px-3 py-2 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-iara-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleLerUrl()}
                    />
                    <button
                      onClick={handleLerUrl}
                      disabled={!url.trim() || lendo}
                      className="px-4 py-2 rounded-lg bg-iara-600 hover:bg-iara-500 disabled:opacity-40 text-white text-sm font-medium transition-all flex items-center gap-2"
                    >
                      {lendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      {lendo ? 'Lendo...' : 'Ler'}
                    </button>
                  </div>
                </div>

                {/* Exemplos de plataformas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: 'YouTube',   icon: <YouTubeIcon size={22} />,   dica: 'Extrai transcrição automática' },
                    { label: 'Artigo',    icon: <Newspaper className="w-5 h-5 text-[#9b9bb5]" />, dica: 'Lê o texto principal' },
                    { label: 'TikTok',    icon: <TikTokIcon size={22} />,    dica: 'Cole o texto manualmente' },
                    { label: 'Instagram', icon: <InstagramIcon size={22} />, dica: 'Cole o texto manualmente' },
                  ].map((p) => (
                    <div key={p.label} className="p-3 rounded-lg bg-[#0a0a14] border border-[#1a1a2e] text-center">
                      <div className="flex justify-center mb-1.5">{p.icon}</div>
                      <div className="text-xs font-medium text-[#c1c1d8]">{p.label}</div>
                      <div className="text-xs text-[#4a4a6a] mt-0.5">{p.dica}</div>
                    </div>
                  ))}
                </div>

                {/* Resultado da leitura */}
                {erroLeitura && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/20 border border-red-700/30 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {erroLeitura}
                  </div>
                )}

                {leitura && leitura.conteudo && (
                  <div className="p-4 rounded-xl bg-[#0f0f20] border border-green-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-green-300">Conteúdo extraído!</span>
                    </div>
                    <p className="text-sm font-medium text-[#f1f1f8] mb-1">{leitura.titulo}</p>
                    <p className="text-xs text-[#6b6b8a] line-clamp-3">{leitura.conteudo.slice(0, 300)}...</p>
                  </div>
                )}

                {leitura && !leitura.conteudo && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-yellow-900/20 border border-yellow-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium text-yellow-300">Não foi possível extrair o conteúdo automaticamente</span>
                      </div>
                      <p className="text-xs text-yellow-400/80">
                        {leitura.aviso || 'Cole o conteúdo do vídeo manualmente no campo abaixo para continuar.'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-[#9b9bb5] font-medium">Cole o conteúdo manualmente:</p>
                      <textarea
                        value={textoManual}
                        onChange={(e) => setTextoManual(e.target.value)}
                        placeholder="Cole aqui a transcrição, legenda ou texto do vídeo..."
                        rows={6}
                        className="w-full bg-[#0f0f20] border border-[#1a1a2e] rounded-xl px-4 py-3 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-iara-500 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Texto manual */}
            {modoConteudo === 'texto' && (
              <div className="space-y-2">
                <p className="text-xs text-[#6b6b8a]">
                  Cole aqui o texto do seu vídeo, post, artigo ou qualquer conteúdo que queira transformar em carrossel.
                </p>
                <textarea
                  value={textoManual}
                  onChange={(e) => setTextoManual(e.target.value)}
                  placeholder="Cole ou digite o conteúdo aqui... Pode ser a transcrição de um vídeo, um texto de blog, uma thread do Twitter, etc."
                  rows={10}
                  className="w-full bg-[#0f0f20] border border-[#1a1a2e] rounded-xl px-4 py-3 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-iara-500 resize-none"
                />
                <p className="text-xs text-[#4a4a6a] text-right">{textoManual.length} caracteres</p>
              </div>
            )}

            {/* Botão próximo */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep('imagens')}
                disabled={!podeProsseguir()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-iara-600 hover:bg-iara-500 disabled:opacity-40 text-white text-sm font-medium transition-all"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════ */}
        {/* STEP 2: IMAGENS */}
        {/* ═══════════════════════════════════ */}
        {step === 'imagens' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[#f1f1f8] mb-1">Imagens de fundo</h2>
              <p className="text-sm text-[#6b6b8a]">
                Adicione até 8 fotos para usar como fundo dos slides. Opcional — sem imagens, a Iara usa cores sólidas da sua paleta.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#2a2a4a] hover:border-iara-600/50 rounded-xl p-8 text-center cursor-pointer transition-all group"
            >
              <Upload className="w-8 h-8 text-[#3a3a5a] group-hover:text-iara-500 mx-auto mb-3 transition-colors" />
              <p className="text-sm text-[#6b6b8a] group-hover:text-[#9b9bb5] transition-colors">
                Arraste as fotos aqui ou <span className="text-iara-400">clique para selecionar</span>
              </p>
              <p className="text-xs text-[#3a3a5a] mt-1">JPG, PNG, WebP — até 8 imagens</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {/* Banco de Fotos */}
            {imagens.length < 8 && (
              <button
                onClick={() => setBancoAberto(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-iara-700/40 hover:border-iara-500/60 text-sm text-iara-400 hover:text-iara-300 hover:bg-iara-900/20 transition-all"
              >
                <Images className="w-4 h-4" />
                Usar fotos do Banco de Fotos
              </button>
            )}

            {/* Preview das imagens */}
            {imagensPreview.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {imagensPreview.map((src, i) => (
                  <div key={i} className="relative group aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Imagem ${i + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-[#1a1a2e]"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <button
                        onClick={() => removerImagem(i)}
                        className="p-1.5 rounded-full bg-red-600 hover:bg-red-500 transition-colors"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                    <div className="absolute bottom-1 right-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded-md">
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {imagensPreview.length === 0 && (
              <div className="p-4 rounded-xl bg-[#0f0f20] border border-[#1a1a2e]">
                <p className="text-xs text-[#6b6b8a] text-center">
                  Sem imagens? Tudo bem! A Iara vai criar um carrossel elegante com cores sólidas baseadas no seu perfil.
                </p>
              </div>
            )}

            {/* Navegação */}
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep('conteudo')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f0f20] border border-[#1a1a2e] text-[#9b9bb5] hover:text-[#f1f1f8] text-sm transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
              <button
                onClick={() => setStep('config')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-iara-600 hover:bg-iara-500 text-white text-sm font-medium transition-all"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════ */}
        {/* STEP 3: CONFIG */}
        {/* ═══════════════════════════════════ */}
        {step === 'config' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[#f1f1f8] mb-1">Configurações do carrossel</h2>
              <p className="text-sm text-[#6b6b8a]">Quantos slides e algum detalhe extra que a Iara deve considerar.</p>
            </div>

            {/* Número de slides */}
            <div>
              <label className="block text-sm font-medium text-[#c1c1d8] mb-3">
                Quantidade de slides
              </label>
              <div className="flex gap-2 flex-wrap">
                {[4, 5, 6, 7, 8, 10, 12].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNumSlides(n)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      numSlides === n
                        ? 'bg-iara-600/30 text-iara-300 border border-iara-600/40'
                        : 'bg-[#0f0f20] text-[#9b9bb5] border border-[#1a1a2e] hover:border-iara-700/30'
                    }`}
                  >
                    {n} slides
                  </button>
                ))}
              </div>
            </div>

            {/* Instruções extras */}
            <div>
              <label className="block text-sm font-medium text-[#c1c1d8] mb-2">
                Instruções adicionais <span className="text-[#4a4a6a] font-normal">(opcional)</span>
              </label>
              <textarea
                value={instrucoes}
                onChange={(e) => setInstrucoes(e.target.value)}
                placeholder="Ex: Use um tom mais descontraído, destaque os pontos práticos, use muito emoji, foque no público iniciante..."
                rows={4}
                className="w-full bg-[#0f0f20] border border-[#1a1a2e] rounded-xl px-4 py-3 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-iara-500 resize-none"
              />
            </div>

            {/* perfil nudge */}
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

            {/* Resumo do que será gerado */}
            <div className="p-4 rounded-xl bg-[#0f0f20] border border-[#1a1a2e] space-y-2">
              <p className="text-xs font-medium text-[#9b9bb5] uppercase tracking-wider mb-3">Resumo</p>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b6b8a]">Fonte do conteúdo</span>
                <span className="text-[#c1c1d8]">
                  {modoConteudo === 'url' ? (leitura?.titulo || url.slice(0, 30) + '...') : 'Texto manual'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b6b8a]">Imagens</span>
                <span className="text-[#c1c1d8]">{imagens.length > 0 ? `${imagens.length} foto(s)` : 'Sem imagens (cores sólidas)'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b6b8a]">Slides</span>
                <span className="text-[#c1c1d8]">{numSlides} slides</span>
              </div>
            </div>

            {/* Navegação */}
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep('imagens')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f0f20] border border-[#1a1a2e] text-[#9b9bb5] hover:text-[#f1f1f8] text-sm transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
              <button
                onClick={() => { setStep('preview'); handleGerar() }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-iara-600 to-accent-purple hover:opacity-90 text-white text-sm font-medium transition-all shadow-lg shadow-iara-900/30"
              >
                <Sparkles className="w-4 h-4" />
                Gerar carrossel
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════ */}
        {/* STEP 4: PREVIEW */}
        {/* ═══════════════════════════════════ */}
        {step === 'preview' && (
          <div className="space-y-6">
            {/* Gerando... */}
            {gerando && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-iara-600 to-accent-purple flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0a0a14] flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-iara-400 animate-spin" />
                  </div>
                </div>
                <p className="text-[#9b9bb5] text-sm">A Iara está criando seu carrossel...</p>
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
                      <a href="/#planos" className="ml-1 underline text-red-300 hover:text-red-200 transition-colors">Ver planos →</a>
                    )}
                  </p>
                </div>
                {!erroGeracao.includes('Faça upgrade') && (
                  <button
                    onClick={handleGerar}
                    className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-700/30 hover:bg-red-700/50 text-xs font-medium transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Tentar de novo
                  </button>
                )}
              </div>
            )}

            {/* Grid de slides */}
            {carrossel && !gerando && (
              <>
                {/* Header com raciocínio + download all */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[#0f0f20] border border-iara-700/20">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-iara-400 uppercase tracking-wider mb-1">Raciocínio da Iara</p>
                    <p className="text-sm text-[#9b9bb5]">{carrossel.raciocinio}</p>
                  </div>
                  <button
                    onClick={downloadTodos}
                    disabled={Object.keys(slidePngs).length < carrossel.slides.length}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-iara-600 hover:bg-iara-500 disabled:opacity-40 text-white text-sm font-medium transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    Baixar todos
                  </button>
                </div>

                {/* Slides grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {carrossel.slides.map((slide) => {
                    const png = slidePngs[slide.ordem]
                    const loading = renderizando[slide.ordem]

                    return (
                      <div key={slide.ordem} className="group relative">
                        <div className="aspect-square rounded-xl overflow-hidden bg-[#0f0f20] border border-[#1a1a2e]">
                          {loading ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <Loader2 className="w-6 h-6 text-iara-400 animate-spin" />
                            </div>
                          ) : png ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={png} alt={`Slide ${slide.ordem}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
                              <ImageIcon className="w-6 h-6 text-[#3a3a5a]" />
                              <p className="text-xs text-[#4a4a6a]">Aguardando renderização</p>
                            </div>
                          )}
                        </div>

                        {/* Info do slide */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#6b6b8a]">
                              Slide {slide.ordem} · {slide.tipo}
                            </span>
                            {png && (
                              <button
                                onClick={() => downloadSlide(slide.ordem)}
                                className="flex items-center gap-1 text-xs text-iara-400 hover:text-iara-300 transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                PNG
                              </button>
                            )}
                          </div>
                          {slide.titulo && (
                            <p className="text-xs text-[#9b9bb5] mt-0.5 line-clamp-1">{slide.titulo}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Chat de ajustes */}
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-[#c1c1d8] mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-iara-400" />
                    Ajustar com a Iara
                  </h3>

                  {/* Histórico do chat */}
                  {chat.length > 0 && (
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                      {chat.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                              msg.role === 'user'
                                ? 'bg-iara-600/20 text-iara-100 border border-iara-600/20'
                                : 'bg-[#0f0f20] text-[#c1c1d8] border border-[#1a1a2e]'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {enviandoChat && (
                        <div className="flex justify-start">
                          <div className="bg-[#0f0f20] border border-[#1a1a2e] px-3 py-2 rounded-lg">
                            <Loader2 className="w-4 h-4 text-iara-400 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sugestões rápidas */}
                  {chat.length === 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {[
                        'Deixa mais curto e direto',
                        'Adiciona mais energia e emojis',
                        'Foco mais no benefício final',
                        'Muda a capa para ser mais impactante',
                      ].map((sugestao) => (
                        <button
                          key={sugestao}
                          onClick={() => setMsgChat(sugestao)}
                          className="px-3 py-1.5 rounded-lg bg-[#0f0f20] border border-[#1a1a2e] text-xs text-[#9b9bb5] hover:border-iara-600/40 hover:text-iara-300 transition-all"
                        >
                          {sugestao}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input do chat */}
                  <form onSubmit={handleEnviarChat} className="flex gap-2">
                    <input
                      type="text"
                      value={msgChat}
                      onChange={(e) => setMsgChat(e.target.value)}
                      placeholder="Ex: Muda o tom para mais informal, adiciona CTA no último slide..."
                      className="flex-1 bg-[#0f0f20] border border-[#1a1a2e] rounded-xl px-4 py-2.5 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-iara-500"
                    />
                    <button
                      type="submit"
                      disabled={!msgChat.trim() || enviandoChat}
                      className="px-4 py-2.5 rounded-xl bg-iara-600 hover:bg-iara-500 disabled:opacity-40 text-white transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* Botão novo carrossel */}
                <div className="flex justify-center pt-4 border-t border-[#1a1a2e]">
                  <button
                    onClick={() => {
                      setStep('conteudo')
                      setCarrossel(null)
                      setSlidePngs({})
                      setChat([])
                      setHistoricoClaude([])
                      setUrl('')
                      setTextoManual('')
                      setLeitura(null)
                      setImagens([])
                      setImagensPreview([])
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f0f20] border border-[#1a1a2e] text-[#9b9bb5] hover:text-[#f1f1f8] text-sm transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Criar novo carrossel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {bancoAberto && (
        <BancoFotosPicker
          multiple
          maxSelect={8 - imagens.length}
          onClose={() => setBancoAberto(false)}
          onConfirm={(dataUrls) => {
            const novasBase64 = dataUrls.map(d => d.replace(/^data:image\/\w+;base64,/, ''))
            setImagens(prev => [...prev, ...novasBase64].slice(0, 8))
            setImagensPreview(prev => [...prev, ...dataUrls].slice(0, 8))
            setBancoAberto(false)
          }}
        />
      )}
    </div>
  )
}
