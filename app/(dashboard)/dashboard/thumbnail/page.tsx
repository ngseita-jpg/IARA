'use client'

import { useState, useRef, useCallback } from 'react'
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
  Play,
  FileText,
  Sliders,
  Images,
  History,
} from 'lucide-react'
import type { ThumbnailLayout } from '@/app/api/thumbnail/gerar/route'
import { HistoricoPanel, salvarHistorico, type HistoricoItem } from '@/components/historico-panel'

type Step = 'info' | 'foto' | 'gerar'
type MensagemChat = { role: 'user' | 'assistant'; content: string }

export default function ThumbnailPage() {
  const [step, setStep] = useState<Step>('info')

  // Step 1: info do vídeo
  const [tituloVideo, setTituloVideo] = useState('')
  const [descricao, setDescricao] = useState('')

  // Step 2: foto
  const [imagemBase64, setImagemBase64] = useState<string | null>(null)
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Geração
  const [gerando, setGerando] = useState(false)
  const [layout, setLayout] = useState<ThumbnailLayout | null>(null)
  const [thumbnailPng, setThumbnailPng] = useState<string | null>(null)
  const [renderizando, setRenderizando] = useState(false)
  const [erroGeracao, setErroGeracao] = useState<string | null>(null)

  // Chat
  const [chat, setChat] = useState<MensagemChat[]>([])
  const [msgChat, setMsgChat] = useState('')
  const [enviandoChat, setEnviandoChat] = useState(false)
  const [historicoClaude, setHistoricoClaude] = useState<{ role: string; content: string }[]>([])
  const [historicoAberto, setHistoricoAberto] = useState(false)

  // ───────────────────────────────────────────
  // Upload de foto
  // ───────────────────────────────────────────
  const handleFile = useCallback((file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setImagemPreview(result)
      setImagemBase64(result)
    }
    reader.readAsDataURL(file)
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) handleFile(file)
  }

  // ───────────────────────────────────────────
  // Gerar thumbnail
  // ───────────────────────────────────────────
  async function handleGerar() {
    setGerando(true)
    setErroGeracao(null)
    setLayout(null)
    setThumbnailPng(null)

    try {
      const res = await fetch('/api/thumbnail/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo_video: tituloVideo,
          descricao,
          imagem_base64: imagemBase64,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar')

      const layoutGerado: ThumbnailLayout = data.layout
      setLayout(layoutGerado)
      setHistoricoClaude([
        { role: 'user', content: `Thumbnail para: ${tituloVideo}` },
        { role: 'assistant', content: data.assistant_message },
      ])
      salvarHistorico('thumbnail', tituloVideo, layoutGerado, { descricao: descricao.slice(0, 80) })

      await renderizarThumbnail(layoutGerado)
    } catch (e: unknown) {
      setErroGeracao(e instanceof Error ? e.message : 'Erro ao gerar thumbnail')
    } finally {
      setGerando(false)
    }
  }

  async function renderizarThumbnail(l: ThumbnailLayout) {
    setRenderizando(true)
    try {
      const res = await fetch('/api/thumbnail/renderizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layout: l,
          imagem_base64: imagemBase64 ?? undefined,
        }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setThumbnailPng(url)
    } catch {
      // silencioso
    } finally {
      setRenderizando(false)
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

    try {
      const novoHistorico = [
        ...historicoClaude,
        { role: 'user' as const, content: novaMensagem },
      ]

      const res = await fetch('/api/thumbnail/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo_video: tituloVideo,
          descricao,
          imagem_base64: imagemBase64,
          historico: novoHistorico,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const layoutAtualizado: ThumbnailLayout = data.layout
      setLayout(layoutAtualizado)
      setHistoricoClaude([...novoHistorico, { role: 'assistant', content: data.assistant_message }])
      setChat((prev) => [...prev, { role: 'assistant', content: layoutAtualizado.raciocinio || 'Thumbnail atualizada!' }])

      setThumbnailPng(null)
      await renderizarThumbnail(layoutAtualizado)
    } catch {
      setChat((prev) => [...prev, { role: 'assistant', content: 'Erro ao ajustar. Tente novamente.' }])
    } finally {
      setEnviandoChat(false)
    }
  }

  // ───────────────────────────────────────────
  // Download
  // ───────────────────────────────────────────
  function handleDownload() {
    if (!thumbnailPng) return
    const a = document.createElement('a')
    a.href = thumbnailPng
    a.download = `thumbnail-${tituloVideo.slice(0, 20).replace(/\s+/g, '-') || 'thumb'}.png`
    a.click()
  }

  // ───────────────────────────────────────────
  // Steps
  // ───────────────────────────────────────────
  const steps: Step[] = ['info', 'foto', 'gerar']
  const stepLabels = ['Vídeo', 'Foto', 'Gerar']
  const stepIcons = [FileText, ImageIcon, Sparkles]
  const currentStepIdx = steps.indexOf(step)

  return (
    <div className="min-h-screen bg-[#080810] text-[#f1f1f8]">
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
            renderizarThumbnail(l)
          }}
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-iara-500 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#f1f1f8]">Gerador de Thumbnail</h1>
                <p className="text-sm text-[#6b6b8a]">Crie thumbnails de alto CTR para seus vídeos em segundos</p>
              </div>
            </div>
            <button
              onClick={() => setHistoricoAberto(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0f0f20] border border-[#1a1a2e] hover:border-accent-purple/40 text-[#6b6b8a] hover:text-purple-400 text-xs font-medium transition-all flex-shrink-0"
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
                        ? 'bg-accent-purple text-white ring-2 ring-accent-purple/30'
                        : isDone
                        ? 'bg-green-600/30 text-green-400 cursor-pointer'
                        : 'bg-[#1a1a2e] text-[#4a4a6a]'
                    }`}
                  >
                    {isDone ? '✓' : i + 1}
                  </button>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-px mx-1 ${i < currentStepIdx ? 'bg-accent-purple/60' : 'bg-[#2a2a4a]'}`} />
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-[#6b6b8a] sm:hidden">
            <span className="text-purple-300 font-medium">{stepLabels[currentStepIdx]}</span>
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
                        ? 'bg-accent-purple/20 text-purple-300 border border-accent-purple/40'
                        : isDone
                        ? 'text-[#9b9bb5] hover:text-purple-300 cursor-pointer'
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
        </div>

        {/* ═══════════════════════════════════ */}
        {/* STEP 1: INFO DO VÍDEO */}
        {/* ═══════════════════════════════════ */}
        {step === 'info' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[#f1f1f8] mb-1">Sobre o seu vídeo</h2>
              <p className="text-sm text-[#6b6b8a]">
                Quanto mais contexto você der, mais precisa e chamativa será a thumbnail.
              </p>
            </div>

            {/* Título do vídeo */}
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
              <p className="text-xs text-[#4a4a6a] mt-1">O título é a base para o texto da thumbnail</p>
            </div>

            {/* Descrição / contexto */}
            <div>
              <label className="block text-sm font-medium text-[#c1c1d8] mb-2">
                Contexto do vídeo <span className="text-[#4a4a6a] font-normal">(opcional, mas recomendado)</span>
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Vou contar como saí do zero, os erros que cometi, as estratégias que funcionaram. Público: empreendedores iniciantes."
                rows={4}
                className="w-full bg-[#0f0f20] border border-[#1a1a2e] rounded-xl px-4 py-3 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-accent-purple resize-none"
              />
            </div>

            {/* Dicas rápidas */}
            <div className="p-4 rounded-xl bg-[#0a0a14] border border-[#1a1a2e]">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-medium text-yellow-400">Dicas para thumbnails de alto CTR</span>
              </div>
              <ul className="space-y-1.5">
                {[
                  'Use números específicos: "7 erros" converte mais que "vários erros"',
                  'Gere curiosidade sem entregar tudo: "O método que ninguém conta"',
                  'Palavras de impacto: GRÁTIS, SEGREDO, REVELADO, NUNCA, SEMPRE',
                  'Seu rosto expressivo na foto aumenta o CTR em até 38%',
                ].map((dica, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#6b6b8a]">
                    <span className="text-iara-400 font-bold mt-0.5">·</span>
                    {dica}
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
                Próximo
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════ */}
        {/* STEP 2: FOTO */}
        {/* ═══════════════════════════════════ */}
        {step === 'foto' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[#f1f1f8] mb-1">Foto de fundo</h2>
              <p className="text-sm text-[#6b6b8a]">
                Adicione uma foto sua ou do assunto do vídeo. Sem foto, a Iara cria um fundo com gradiente de cores.
              </p>
            </div>

            {/* Upload */}
            {!imagemPreview ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#2a2a4a] hover:border-accent-purple/50 rounded-xl p-10 text-center cursor-pointer transition-all group"
              >
                <Upload className="w-8 h-8 text-[#3a3a5a] group-hover:text-accent-purple mx-auto mb-3 transition-colors" />
                <p className="text-sm text-[#6b6b8a] group-hover:text-[#9b9bb5] transition-colors">
                  Arraste a foto ou <span className="text-accent-purple">clique para selecionar</span>
                </p>
                <p className="text-xs text-[#3a3a5a] mt-1">JPG ou PNG — 1 foto</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />
              </div>
            ) : (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagemPreview}
                  alt="Foto selecionada"
                  className="w-full max-h-64 object-cover rounded-xl border border-[#1a1a2e]"
                />
                <button
                  onClick={() => { setImagemPreview(null); setImagemBase64(null) }}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-lg">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs text-white">Foto adicionada</span>
                </div>
              </div>
            )}

            {/* Aviso sobre foto com rosto */}
            <div className="p-3 rounded-lg bg-accent-purple/10 border border-accent-purple/20">
              <p className="text-xs text-purple-300">
                <span className="font-medium">Dica pro:</span> Thumbnails com seu rosto expressivo (surpresa, empolgação, foco)
                performam melhor do que só texto. Use uma foto de qualidade!
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('info')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f0f20] border border-[#1a1a2e] text-[#9b9bb5] hover:text-[#f1f1f8] text-sm transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
              <button
                onClick={() => { setStep('gerar'); handleGerar() }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-accent-purple to-iara-600 hover:opacity-90 text-white text-sm font-medium transition-all shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                Gerar thumbnail
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════ */}
        {/* STEP 3: RESULTADO */}
        {/* ═══════════════════════════════════ */}
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
                <p className="text-[#9b9bb5] text-sm">Criando sua thumbnail de alto CTR...</p>
              </div>
            )}

            {/* Erro */}
            {erroGeracao && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-900/20 border border-red-700/30 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Erro ao gerar</p>
                  <p className="text-xs mt-0.5 text-red-400/70">{erroGeracao}</p>
                </div>
                <button
                  onClick={handleGerar}
                  className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-700/30 hover:bg-red-700/50 text-xs font-medium transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  Tentar de novo
                </button>
              </div>
            )}

            {/* Preview da thumbnail */}
            {layout && !gerando && (
              <>
                {/* Raciocínio */}
                <div className="p-4 rounded-xl bg-[#0f0f20] border border-accent-purple/20">
                  <p className="text-xs font-medium text-purple-400 uppercase tracking-wider mb-1">Estratégia da Iara</p>
                  <p className="text-sm text-[#9b9bb5]">{layout.raciocinio}</p>
                </div>

                {/* Thumbnail preview */}
                <div className="relative">
                  {renderizando || (!thumbnailPng && !erroGeracao) ? (
                    <div className="aspect-video rounded-xl bg-[#0f0f20] border border-[#1a1a2e] flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-accent-purple animate-spin" />
                    </div>
                  ) : thumbnailPng ? (
                    <div className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbnailPng}
                        alt="Thumbnail gerada"
                        className="w-full rounded-xl border border-[#1a1a2e]"
                      />
                      {/* Download overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <button
                          onClick={handleDownload}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Baixar PNG (1280×720)
                        </button>
                      </div>
                      {/* Badge de resolução */}
                      <div className="absolute top-3 left-3 bg-black/60 px-2 py-1 rounded-lg text-xs text-white">
                        1280 × 720
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Botão download separado */}
                {thumbnailPng && (
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent-purple hover:opacity-90 text-white font-medium text-sm transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Baixar thumbnail (PNG 1280×720)
                  </button>
                )}

                {/* Info do layout */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Título gerado', value: layout.titulo_principal },
                    { label: 'Posição do texto', value: layout.posicao_texto },
                    { label: 'Estilo', value: layout.estilo_titulo },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-lg bg-[#0f0f20] border border-[#1a1a2e]">
                      <p className="text-xs text-[#4a4a6a] mb-1">{item.label}</p>
                      <p className="text-xs font-medium text-[#c1c1d8] truncate">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Chat de ajustes */}
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
                          }`}>
                            {msg.content}
                          </div>
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
                      {[
                        'Deixa o título mais curto e impactante',
                        'Muda a cor para mais vibrante',
                        'Coloca um badge de número',
                        'Testa com texto no topo',
                      ].map((sugestao) => (
                        <button
                          key={sugestao}
                          onClick={() => setMsgChat(sugestao)}
                          className="px-3 py-1.5 rounded-lg bg-[#0f0f20] border border-[#1a1a2e] text-xs text-[#9b9bb5] hover:border-accent-purple/40 hover:text-purple-300 transition-all"
                        >
                          {sugestao}
                        </button>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleEnviarChat} className="flex gap-2">
                    <input
                      type="text"
                      value={msgChat}
                      onChange={(e) => setMsgChat(e.target.value)}
                      placeholder="Ex: Coloca a palavra GRATUITO, muda para fundo escuro..."
                      className="flex-1 bg-[#0f0f20] border border-[#1a1a2e] rounded-xl px-4 py-2.5 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-accent-purple"
                    />
                    <button
                      type="submit"
                      disabled={!msgChat.trim() || enviandoChat}
                      className="px-4 py-2.5 rounded-xl bg-accent-purple hover:opacity-90 disabled:opacity-40 text-white transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* Criar nova */}
                <div className="flex justify-center pt-4 border-t border-[#1a1a2e]">
                  <button
                    onClick={() => {
                      setStep('info')
                      setLayout(null)
                      setThumbnailPng(null)
                      setChat([])
                      setHistoricoClaude([])
                      setTituloVideo('')
                      setDescricao('')
                      setImagemBase64(null)
                      setImagemPreview(null)
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f0f20] border border-[#1a1a2e] text-[#9b9bb5] hover:text-[#f1f1f8] text-sm transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Criar nova thumbnail
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
