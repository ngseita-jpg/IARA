'use client'

import { Flame, BookOpen, Megaphone, Sparkles, Layers } from 'lucide-react'

type Props = {
  texto: string
  modo: 'roteiro' | 'hooks'
  loading?: boolean
}

// Limpa markdown residual que a IA possa emitir contra as regras
function limparMarkdown(linha: string): string {
  return linha
    .replace(/\*\*(.+?)\*\*/g, '$1')   // remove **bold**
    .replace(/^#+\s*/g, '')             // remove # headers
    .replace(/^-\s+/, '')               // remove bullets soltos
    .replace(/—/g, ',')                 // travessao -> virgula
    .replace(/--/g, ',')                // hifen duplo -> virgula
    .trim()
}

const RE_DIRETIVA = /^\[.+\]$/
const RE_SLIDE = /^Slide\s+(\d+):\s*(.*)$/i
const RE_HOOK_TITULO = /^Hook\s+(\d+)\s*\((.+?)\)\s*$/i

type Bloco = {
  tipo: 'hook' | 'desenvolvimento' | 'cta' | 'hook_alt' | 'quando_usar'
  rotulo?: string
  subrotulo?: string
  conteudo: string[]
}

function parseRoteiro(texto: string): Bloco[] {
  const linhas = texto.split('\n').map(l => l.trim())
  const blocos: Bloco[] = []
  let atual: Bloco | null = null

  for (const raw of linhas) {
    const linha = limparMarkdown(raw)
    if (!linha) {
      if (atual) atual.conteudo.push('')
      continue
    }

    const upper = linha.toUpperCase()

    if (upper === 'HOOK') {
      if (atual) blocos.push(atual)
      atual = { tipo: 'hook', rotulo: 'HOOK', conteudo: [] }
      continue
    }
    if (upper === 'DESENVOLVIMENTO' || upper.startsWith('DESENVOLVIMENTO:')) {
      if (atual) blocos.push(atual)
      atual = { tipo: 'desenvolvimento', rotulo: 'DESENVOLVIMENTO', conteudo: [] }
      continue
    }
    if (upper === 'CTA' || upper.startsWith('CTA:')) {
      if (atual) blocos.push(atual)
      atual = { tipo: 'cta', rotulo: 'CTA', conteudo: [] }
      continue
    }

    const matchHook = linha.match(RE_HOOK_TITULO)
    if (matchHook) {
      if (atual) blocos.push(atual)
      atual = {
        tipo: 'hook_alt',
        rotulo: `Hook ${matchHook[1]}`,
        subrotulo: matchHook[2],
        conteudo: [],
      }
      continue
    }

    if (linha.startsWith('Quando usar:')) {
      if (atual) blocos.push(atual)
      atual = { tipo: 'quando_usar', rotulo: 'Quando usar cada hook', conteudo: [linha.replace(/^Quando usar:\s*/, '')] }
      continue
    }

    if (atual) atual.conteudo.push(linha)
    else {
      // texto orfao antes de qualquer rotulo — joga em desenvolvimento generico
      atual = { tipo: 'desenvolvimento', conteudo: [linha] }
    }
  }
  if (atual) blocos.push(atual)
  return blocos
}

function ConteudoBloco({ linhas }: { linhas: string[] }) {
  // Junta linhas em paragrafos (linha vazia = quebra)
  const paragrafos: { tipo: 'p' | 'diretiva' | 'slide'; texto: string; slideNum?: string }[] = []
  let buffer: string[] = []

  const flush = () => {
    if (buffer.length === 0) return
    paragrafos.push({ tipo: 'p', texto: buffer.join(' ') })
    buffer = []
  }

  for (const linha of linhas) {
    if (!linha) {
      flush()
      continue
    }
    if (RE_DIRETIVA.test(linha)) {
      flush()
      paragrafos.push({ tipo: 'diretiva', texto: linha.replace(/^\[|\]$/g, '') })
      continue
    }
    const matchSlide = linha.match(RE_SLIDE)
    if (matchSlide) {
      flush()
      paragrafos.push({ tipo: 'slide', slideNum: matchSlide[1], texto: matchSlide[2] })
      continue
    }
    buffer.push(linha)
  }
  flush()

  return (
    <div className="space-y-3">
      {paragrafos.map((p, i) => {
        if (p.tipo === 'diretiva') {
          return (
            <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-iara-900/40 border border-iara-700/30 text-[11px] font-medium text-iara-300 uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              {p.texto}
            </div>
          )
        }
        if (p.tipo === 'slide') {
          return (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-iara-600 flex items-center justify-center text-xs font-bold text-white">
                {p.slideNum}
              </div>
              <p className="text-sm text-[#d4d4e8] leading-relaxed pt-1.5">{p.texto}</p>
            </div>
          )
        }
        return (
          <p key={i} className="text-[15px] text-[#dcdcec] leading-[1.7]">
            {p.texto}
          </p>
        )
      })}
    </div>
  )
}

const ESTILO_BLOCO: Record<Bloco['tipo'], { icon: typeof Flame; cor: string; bg: string; border: string }> = {
  hook: {
    icon: Flame,
    cor: 'text-amber-300',
    bg: 'bg-gradient-to-br from-amber-950/40 to-orange-950/30',
    border: 'border-amber-700/40',
  },
  desenvolvimento: {
    icon: BookOpen,
    cor: 'text-iara-300',
    bg: 'bg-gradient-to-br from-iara-950/40 to-violet-950/30',
    border: 'border-iara-700/40',
  },
  cta: {
    icon: Megaphone,
    cor: 'text-pink-300',
    bg: 'bg-gradient-to-br from-pink-950/40 to-fuchsia-950/30',
    border: 'border-pink-700/40',
  },
  hook_alt: {
    icon: Flame,
    cor: 'text-amber-300',
    bg: 'bg-gradient-to-br from-amber-950/40 to-orange-950/30',
    border: 'border-amber-700/40',
  },
  quando_usar: {
    icon: Layers,
    cor: 'text-cyan-300',
    bg: 'bg-gradient-to-br from-cyan-950/30 to-teal-950/30',
    border: 'border-cyan-700/40',
  },
}

export function RoteiroRender({ texto, modo, loading }: Props) {
  if (!texto) return null

  const blocos = parseRoteiro(texto)
  if (blocos.length === 0) {
    return (
      <p className="text-sm text-[#9b9bb5] italic">{loading ? 'Iara está escrevendo...' : 'Nenhum conteúdo gerado.'}</p>
    )
  }

  return (
    <div className="space-y-4">
      {blocos.map((b, i) => {
        const estilo = ESTILO_BLOCO[b.tipo]
        const Icon = estilo.icon
        return (
          <div
            key={i}
            className={`rounded-2xl border ${estilo.border} ${estilo.bg} p-5 backdrop-blur-sm`}
          >
            {b.rotulo && (
              <div className="flex items-center gap-2 mb-3">
                <div className={`flex-shrink-0 w-7 h-7 rounded-lg bg-black/30 border border-white/5 flex items-center justify-center ${estilo.cor}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <h3 className={`text-[11px] font-black uppercase tracking-[0.15em] ${estilo.cor}`}>
                  {b.rotulo}
                  {b.subrotulo && (
                    <span className="ml-2 text-[#9b9bb5] font-medium tracking-normal normal-case">
                      · {b.subrotulo}
                    </span>
                  )}
                </h3>
              </div>
            )}
            <ConteudoBloco linhas={b.conteudo} />
          </div>
        )
      })}
      {loading && (
        <span className="inline-block w-1.5 h-4 bg-iara-400 animate-pulse ml-1 align-middle" />
      )}
    </div>
  )
}
