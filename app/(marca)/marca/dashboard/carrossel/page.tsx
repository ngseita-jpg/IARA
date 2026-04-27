'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Layers, Sparkles, Loader2, Download, AlertCircle, ArrowRight,
  Upload, X, Wand2, Pencil, Image as ImageIcon,
} from 'lucide-react'
import type { Slide, CarrosselData } from '@/app/api/carrossel/gerar/route'
import { CarrosselCanvasEditor } from '@/components/carrossel-canvas-editor'
import { carrosselParaSlide2 } from '@/lib/carrossel-canvas-adapter'
import {
  preloadImages, slide2ToPngUrl, type ImageCache,
} from '@/lib/carrossel-canvas-renderer'
import type { Slide2 } from '@/lib/carrossel-canvas-types'

const COR_MARCA = '#a855f7'

function resizeImage(dataUrl: string, maxDim = 800, quality = 0.72): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

export default function CarrosselMarcaPage() {
  const [conteudo, setConteudo] = useState('')
  const [plataforma, setPlataforma] = useState('instagram')
  const [numSlides, setNumSlides] = useState(6)
  const [gerando, setGerando] = useState(false)
  const [carrossel, setCarrossel] = useState<CarrosselData | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [raciocinio, setRaciocinio] = useState('')

  // Imagens (igual flow do criador)
  const [imagens, setImagens] = useState<string[]>([])           // base64
  const [imagensPreview, setImagensPreview] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageCache, setImageCache] = useState<ImageCache>(new Map())

  // PNGs renderizados client-side por ordem
  const [slidePngs, setSlidePngs] = useState<Record<number, string>>({})
  const [renderizando, setRenderizando] = useState<Record<number, boolean>>({})

  // Editor Canvas
  const [canvasEditorAberto, setCanvasEditorAberto] = useState(false)
  const [slidesCanvas, setSlidesCanvas] = useState<Slide2[] | null>(null)

  // ─── Imagens ──────────────────────────────────────────
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const selected = Array.from(files).slice(0, 8 - imagens.length)
    let pendentes = selected.length
    const novos: string[] = new Array(selected.length)
    const novosPreview: string[] = new Array(selected.length)

    selected.forEach((file, idx) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const raw = e.target?.result as string
        const resized = await resizeImage(raw)
        novos[idx] = resized.replace(/^data:image\/\w+;base64,/, '')
        novosPreview[idx] = resized
        pendentes--
        if (pendentes === 0) {
          setImagens(prev => [...prev, ...novos])
          setImagensPreview(prev => [...prev, ...novosPreview])
        }
      }
      reader.readAsDataURL(file)
    })
  }, [imagens.length])

  function removerImagem(idx: number) {
    setImagens(prev => prev.filter((_, i) => i !== idx))
    setImagensPreview(prev => prev.filter((_, i) => i !== idx))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  // ─── Renderização client-side ─────────────────────────
  async function renderizarSlide2(s2: Slide2, cache: ImageCache) {
    setRenderizando(prev => ({ ...prev, [s2.ordem]: true }))
    try {
      const url = await slide2ToPngUrl(s2, cache, { watermark: false })
      setSlidePngs(prev => {
        const old = prev[s2.ordem]
        if (old?.startsWith('blob:')) URL.revokeObjectURL(old)
        return { ...prev, [s2.ordem]: url }
      })
    } catch (e) {
      console.error(`Render slide ${s2.ordem}:`, e)
      setSlidePngs(prev => ({ ...prev, [s2.ordem]: 'ERROR' }))
    } finally {
      setRenderizando(prev => ({ ...prev, [s2.ordem]: false }))
    }
  }

  async function aplicarEdicoesCanvas(novos: Slide2[]) {
    setSlidesCanvas(novos)
    let cache = imageCache
    if (cache.size === 0 && imagens.length > 0) {
      cache = await preloadImages(imagens)
      setImageCache(cache)
    }
    await Promise.all(novos.map(s2 => renderizarSlide2(s2, cache)))
  }

  // ─── Gerar ────────────────────────────────────────────
  async function gerar() {
    if (conteudo.trim().length < 30) {
      setErro('Descreva o conteúdo com pelo menos 30 caracteres')
      return
    }
    setGerando(true); setErro(null); setCarrossel(null); setSlidePngs({}); setRaciocinio('')

    try {
      const res = await fetch('/api/carrossel/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conteudo,
          plataforma,
          num_slides: Math.max(numSlides, imagens.length),
          num_imagens: imagens.length,
          incluir_encerramento: true,
          modo: 'marca',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao gerar carrossel')
        return
      }
      const c: CarrosselData = data.carrossel ?? { slides: data.slides ?? [], paleta: data.paleta, fonte_sugerida: data.fonte_sugerida ?? 'Inter', raciocinio: data.raciocinio ?? '' }
      setCarrossel(c)
      setRaciocinio(c.raciocinio ?? '')

      // Pré-carrega imagens, converte pra Slide2 e renderiza tudo client-side (zero compute Vercel)
      let cache = imageCache
      if (cache.size !== imagens.length && imagens.length > 0) {
        cache = await preloadImages(imagens)
        setImageCache(cache)
      }
      const s2s = carrosselParaSlide2(c.slides)
      setSlidesCanvas(s2s)
      await Promise.all(s2s.map(s2 => renderizarSlide2(s2, cache)))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro de conexão')
    } finally {
      setGerando(false)
    }
  }

  // ─── Download ─────────────────────────────────────────
  function baixar(ordem: number) {
    const url = slidePngs[ordem]
    if (!url || url === 'ERROR') return
    const a = document.createElement('a')
    a.href = url
    a.download = `carrossel-marca-${String(ordem).padStart(2, '0')}.png`
    a.click()
  }

  function baixarTodos() {
    Object.entries(slidePngs).forEach(([ordem, url], i) => {
      if (url && url !== 'ERROR') setTimeout(() => baixar(Number(ordem)), i * 200)
    })
  }

  function abrirEditor() {
    if (!carrossel) return
    if (!slidesCanvas) setSlidesCanvas(carrosselParaSlide2(carrossel.slides))
    setCanvasEditorAberto(true)
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-semibold tracking-[0.2em] uppercase mb-3"
          style={{ borderColor: `${COR_MARCA}4D`, backgroundColor: `${COR_MARCA}1A`, color: COR_MARCA }}>
          <Sparkles className="w-3 h-3" />
          Gerador de Carrossel B2B
        </div>
        <h1 className="font-display font-black text-[clamp(28px,4vw,40px)] leading-tight tracking-display mb-2">
          Conteúdo institucional{' '}
          <span className="font-editorial font-normal" style={{ color: '#E2C068' }}>em minutos</span>
        </h1>
        <p className="text-[#9b9bb5] max-w-xl text-[15px]">
          Suba fotos da equipe ou produto, descreva o que quer comunicar, e edite o resultado num editor visual completo.
        </p>
      </div>

      <div className="rounded-2xl border border-[#1a1a2e] bg-[#0d0d1a]/80 p-6 sm:p-8 mb-6 space-y-5">
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-1.5">O que quer comunicar? *</label>
          <textarea
            value={conteudo}
            onChange={e => setConteudo(e.target.value)}
            rows={5}
            placeholder="Ex: Lançamento da nova linha de cremes anti-idade. Queremos educar o público sobre os 5 benefícios do ácido hialurônico em produtos naturais, mostrando antes/depois e o diferencial da nossa formulação veggie."
            className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:outline-none resize-none"
            style={{ borderColor: conteudo ? `${COR_MARCA}66` : undefined }}
          />
        </div>

        {/* Upload de fotos */}
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-2">
            Fotos (opcional · até 8)
          </label>
          {imagensPreview.length === 0 ? (
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#2a2a4a] hover:border-purple-600/50 rounded-xl p-6 text-center cursor-pointer transition-all group"
            >
              <Upload className="w-7 h-7 text-[#3a3a5a] group-hover:text-purple-400 mx-auto mb-2" />
              <p className="text-xs text-[#6b6b8a]">
                Arraste ou <span className="text-purple-400">clique pra selecionar</span>
              </p>
              <p className="text-[10px] text-[#3a3a5a] mt-0.5">JPG, PNG, WebP — até 8 imagens</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-2">
                {imagensPreview.map((src, i) => (
                  <div key={i} className="relative group aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover rounded-lg border border-[#1a1a2e]" />
                    <button
                      onClick={() => removerImagem(i)}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-red-600 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                    <span className="absolute bottom-1 right-1 text-[8px] bg-black/60 text-white px-1 rounded">{i + 1}</span>
                  </div>
                ))}
                {imagensPreview.length < 8 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-[#2a2a4a] hover:border-purple-600/50 flex items-center justify-center text-[#3a3a5a] hover:text-purple-400 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-[#5a5a7a]">{imagensPreview.length} de 8 — adicione fotos pra deixar o carrossel mais visual</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-1.5">Plataforma</label>
            <select value={plataforma} onChange={e => setPlataforma(e.target.value)}
              className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-3 py-2.5 text-sm text-[#f1f1f8] focus:outline-none">
              <option value="instagram">Instagram — visual, hooks fortes</option>
              <option value="linkedin">LinkedIn — profissional, insights</option>
              <option value="tiktok">TikTok — jovem, dinâmico</option>
              <option value="pinterest">Pinterest — evergreen, estético</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-1.5">Número de slides</label>
            <select value={numSlides} onChange={e => setNumSlides(Number(e.target.value))}
              className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-3 py-2.5 text-sm text-[#f1f1f8] focus:outline-none">
              <option value={4}>4 slides</option>
              <option value={5}>5 slides</option>
              <option value={6}>6 slides</option>
              <option value={7}>7 slides</option>
              <option value={8}>8 slides</option>
              <option value={10}>10 slides</option>
            </select>
          </div>
        </div>

        <button
          onClick={gerar}
          disabled={gerando}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 hover:opacity-90"
          style={{ background: `linear-gradient(135deg,${COR_MARCA},#6366f1,#ec4899)` }}
        >
          {gerando ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
           : <><Sparkles className="w-4 h-4" /> Gerar carrossel</>}
        </button>

        {erro && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {erro}
            {erro.toLowerCase().includes('limite') && (
              <Link href="/empresas#planos" className="ml-auto text-xs font-semibold underline text-red-300">
                Ver planos
              </Link>
            )}
          </div>
        )}
      </div>

      {raciocinio && (
        <div className="rounded-xl border border-[#C9A84C]/25 bg-[#0f0b06]/60 p-4 mb-6">
          <p className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-1.5" style={{ color: '#C9A84C' }}>Estratégia da Iara</p>
          <p className="text-[13px] text-[#c1c1d8] leading-relaxed">{raciocinio}</p>
        </div>
      )}

      {carrossel && carrossel.slides.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-[11px] tracking-[0.3em] uppercase font-semibold" style={{ color: COR_MARCA }}>
              {carrossel.slides.length} slides gerados
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={abrirEditor}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white relative"
                style={{ background: `linear-gradient(135deg,${COR_MARCA},#ec4899)` }}
              >
                <Wand2 className="w-3.5 h-3.5" />
                Editor Canvas
                <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-[#E2C068] text-[#0a0a14] tracking-wider">BETA</span>
              </button>
              <button
                onClick={baixarTodos}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#2a2a4a] bg-[#13131f] text-[#9b9bb5] hover:text-white"
              >
                <Download className="w-3 h-3" />
                Baixar todos
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {carrossel.slides.map((slide: Slide) => {
              const png = slidePngs[slide.ordem]
              const loading = renderizando[slide.ordem]

              return (
                <div key={slide.ordem} className="rounded-2xl border border-[#1a1a2e] bg-[#0d0d1a]/80 overflow-hidden">
                  {loading || !png ? (
                    <div className="aspect-square flex items-center justify-center bg-[#08080f]">
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: COR_MARCA }} />
                    </div>
                  ) : png === 'ERROR' ? (
                    <div className="aspect-square flex flex-col items-center justify-center bg-[#08080f] gap-2 p-4">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <p className="text-[10px] text-red-400 text-center">Falha ao renderizar</p>
                    </div>
                  ) : (
                    <div className="relative group aspect-square bg-[#08080f]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={png} alt={`Slide ${slide.ordem}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={abrirEditor}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13131f] border border-[#2a2a4a] text-white text-xs font-semibold"
                        >
                          <Pencil className="w-3 h-3" />
                          Editar
                        </button>
                        <button
                          onClick={() => baixar(slide.ordem)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black font-semibold text-xs"
                        >
                          <Download className="w-3 h-3" />
                          PNG
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-[10px] uppercase tracking-widest text-[#5a5a7a] mb-1">Slide {slide.ordem} · {slide.tipo}</p>
                    {slide.titulo && <p className="font-bold text-sm text-[#f1f1f8] mb-1 line-clamp-2">{slide.titulo}</p>}
                    <p className="text-xs text-[#9b9bb5] leading-relaxed line-clamp-3">{slide.corpo}</p>
                    {slide.cta && <p className="mt-2 text-xs font-semibold flex items-center gap-1" style={{ color: COR_MARCA }}>
                      {slide.cta} <ArrowRight className="w-3 h-3" />
                    </p>}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {!carrossel && !gerando && (
        <div className="rounded-2xl border border-dashed border-[#1a1a2e] bg-[#0d0d1a]/40 p-10 text-center">
          <Layers className="w-10 h-10 text-[#3a3a5a] mx-auto mb-3" />
          <p className="text-[#6b6b8a] text-sm mb-1">Nenhum carrossel gerado ainda</p>
          <p className="text-[#5a5a7a] text-xs">Descreva o que quer comunicar acima e clique em gerar.</p>
        </div>
      )}

      {/* Editor Canvas */}
      {canvasEditorAberto && slidesCanvas && (
        <CarrosselCanvasEditor
          slides={slidesCanvas}
          imagensBase64={imagens}
          onFechar={() => setCanvasEditorAberto(false)}
          onSalvar={aplicarEdicoesCanvas}
          watermark={false}
        />
      )}
    </div>
  )
  void ImageIcon
}
