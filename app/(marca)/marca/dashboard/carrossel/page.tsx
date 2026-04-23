'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Layers, Sparkles, Loader2, Download, AlertCircle, ArrowRight } from 'lucide-react'

type Slide = {
  ordem: number
  tipo: string
  titulo?: string
  corpo: string
  cta?: string
}

export default function CarrosselMarcaPage() {
  const [conteudo, setConteudo] = useState('')
  const [plataforma, setPlataforma] = useState('instagram')
  const [numSlides, setNumSlides] = useState(6)
  const [gerando, setGerando] = useState(false)
  const [slides, setSlides] = useState<Slide[]>([])
  const [pngs, setPngs] = useState<string[]>([])
  const [renderizando, setRenderizando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [raciocinio, setRaciocinio] = useState('')

  async function gerar() {
    if (conteudo.trim().length < 30) {
      setErro('Descreva o conteúdo com pelo menos 30 caracteres')
      return
    }
    setGerando(true); setErro(null); setSlides([]); setPngs([]); setRaciocinio('')

    try {
      const res = await fetch('/api/carrossel/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conteudo,
          plataforma,
          num_slides: numSlides,
          num_imagens: 0,
          incluir_encerramento: true,
          modo: 'marca',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao gerar carrossel')
        return
      }
      setSlides(data.slides ?? [])
      setRaciocinio(data.raciocinio ?? '')

      // Renderiza cada slide em PNG
      setRenderizando(true)
      const pngsGerados: string[] = []
      for (const slide of data.slides ?? []) {
        try {
          const renderRes = await fetch('/api/carrossel/renderizar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              slide,
              paleta: data.paleta,
              fonte_sugerida: data.fonte_sugerida,
              imagens: [],
              modo: 'marca',
            }),
          })
          if (renderRes.ok) {
            const blob = await renderRes.blob()
            pngsGerados.push(URL.createObjectURL(blob))
          } else {
            pngsGerados.push('')
          }
        } catch {
          pngsGerados.push('')
        }
      }
      setPngs(pngsGerados)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro de conexão')
    } finally {
      setGerando(false)
      setRenderizando(false)
    }
  }

  function baixar(idx: number) {
    if (!pngs[idx]) return
    const a = document.createElement('a')
    a.href = pngs[idx]
    a.download = `carrossel-${idx + 1}.png`
    a.click()
  }

  function baixarTodos() {
    pngs.forEach((_, i) => setTimeout(() => baixar(i), i * 300))
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-pink/30 bg-accent-pink/10 text-[10px] font-semibold tracking-[0.2em] uppercase text-accent-pink mb-3">
          <Sparkles className="w-3 h-3" />
          Gerador de Carrossel B2B
        </div>
        <h1 className="font-display font-black text-[clamp(28px,4vw,40px)] leading-tight tracking-display mb-2">
          Conteúdo institucional{' '}
          <span className="font-editorial font-normal" style={{ color: '#E2C068' }}>em minutos</span>
        </h1>
        <p className="text-[#9b9bb5] max-w-xl text-[15px]">
          Gere carrosseis prontos pra publicar com o tom da sua marca. Perfeito pra educar o mercado, divulgar produto, mostrar cases ou anunciar lançamentos.
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
            className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-accent-pink/60 focus:outline-none resize-none"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-1.5">Plataforma</label>
            <select value={plataforma} onChange={e => setPlataforma(e.target.value)}
              className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-3 py-2.5 text-sm text-[#f1f1f8] focus:border-accent-pink/60 focus:outline-none">
              <option value="instagram">Instagram — visual, hooks fortes</option>
              <option value="linkedin">LinkedIn — profissional, insights</option>
              <option value="tiktok">TikTok — jovem, dinâmico</option>
              <option value="pinterest">Pinterest — evergreen, estético</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase font-semibold text-[#6b6b8a] mb-1.5">Número de slides</label>
            <select value={numSlides} onChange={e => setNumSlides(Number(e.target.value))}
              className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-3 py-2.5 text-sm text-[#f1f1f8] focus:border-accent-pink/60 focus:outline-none">
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
          disabled={gerando || renderizando}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#ec4899,#a855f7,#6366f1)' }}
        >
          {gerando ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando estratégia...</>
           : renderizando ? <><Loader2 className="w-4 h-4 animate-spin" /> Renderizando PNGs...</>
           : <><Sparkles className="w-4 h-4" /> Gerar carrossel</>}
        </button>

        {erro && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {erro}
            {erro.includes('Limite') && (
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

      {slides.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] tracking-[0.3em] uppercase font-semibold text-accent-pink">
              {slides.length} slides gerados
            </p>
            {pngs.length > 0 && pngs.some(p => p) && (
              <button onClick={baixarTodos}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#ec4899,#a855f7)' }}>
                <Download className="w-3 h-3" />
                Baixar todos
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {slides.map((slide, i) => (
              <div key={i} className="rounded-2xl border border-[#1a1a2e] bg-[#0d0d1a]/80 overflow-hidden">
                {pngs[i] ? (
                  <div className="relative group aspect-square bg-[#08080f]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pngs[i]} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                    <button onClick={() => baixar(i)}
                      className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-semibold text-sm">
                        <Download className="w-4 h-4" />
                        Baixar PNG
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="aspect-square flex items-center justify-center bg-[#0a0a14]">
                    <Loader2 className="w-5 h-5 animate-spin text-[#5a5a7a]" />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-widest text-[#5a5a7a] mb-1">Slide {i + 1} · {slide.tipo}</p>
                  {slide.titulo && <p className="font-bold text-sm text-[#f1f1f8] mb-1 line-clamp-2">{slide.titulo}</p>}
                  <p className="text-xs text-[#9b9bb5] leading-relaxed line-clamp-3">{slide.corpo}</p>
                  {slide.cta && <p className="mt-2 text-xs font-semibold text-accent-pink flex items-center gap-1">
                    {slide.cta} <ArrowRight className="w-3 h-3" />
                  </p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {slides.length === 0 && !gerando && (
        <div className="rounded-2xl border border-dashed border-[#1a1a2e] bg-[#0d0d1a]/40 p-10 text-center">
          <Layers className="w-10 h-10 text-[#3a3a5a] mx-auto mb-3" />
          <p className="text-[#6b6b8a] text-sm mb-1">Nenhum carrossel gerado ainda</p>
          <p className="text-[#5a5a7a] text-xs">Descreve acima o que quer comunicar e clica em gerar.</p>
        </div>
      )}
    </div>
  )
}
