'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Lightbulb, Send, Sparkles, RefreshCw,
  Copy, Check, Flame, ChevronRight, Zap,
} from 'lucide-react'

/* ─────────────────────────── types ────────────────────────────────── */

interface Idea {
  titulo: string
  hook: string
  angulo: string
  formato: string
  urgencia: number
  porque: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string          // raw text (with ideas block stripped)
  ideas?: Idea[]
  streaming?: boolean
  generatingIdeas?: boolean  // true enquanto o bloco ```ideas está sendo escrito
}

/* ─────────────────────────── helpers ──────────────────────────────── */

function parseIdeas(raw: string): { text: string; ideas: Idea[] | null } {
  const match = raw.match(/```ideas\n([\s\S]*?)\n```/)
  if (!match) return { text: raw, ideas: null }
  try {
    const ideas = JSON.parse(match[1]) as Idea[]
    const text = raw.replace(/```ideas\n[\s\S]*?\n```/, '').trim()
    return { text, ideas }
  } catch {
    return { text: raw, ideas: null }
  }
}

function urgencyStyle(n: number) {
  if (n >= 8) return { badge: 'text-red-400 bg-red-950/50 border-red-800/40',    bar: 'bg-red-500' }
  if (n >= 6) return { badge: 'text-amber-400 bg-amber-950/50 border-amber-800/40', bar: 'bg-amber-500' }
  return          { badge: 'text-iara-400 bg-iara-950/60 border-iara-700/40',    bar: 'bg-iara-500' }
}

const FORMAT_GRADIENT: Record<string, string> = {
  'Reel':        'from-accent-pink/20 to-accent-purple/10 border-accent-pink/25',
  'Carrossel':   'from-iara-600/20 to-accent-purple/10 border-iara-700/25',
  'Stories':     'from-accent-purple/20 to-iara-600/10 border-accent-purple/25',
  'Vídeo longo': 'from-red-900/20 to-iara-600/10 border-red-800/20',
  'Live':        'from-green-900/20 to-iara-600/10 border-green-800/20',
  'YouTube Shorts': 'from-red-900/20 to-accent-pink/10 border-red-800/20',
}

function cardGradient(formato: string) {
  const key = Object.keys(FORMAT_GRADIENT).find(k => formato.includes(k))
  return key ? FORMAT_GRADIENT[key] : 'from-iara-600/15 to-accent-purple/10 border-iara-700/20'
}

/* ─────────────────────────── sub-components ───────────────────────── */

function IdeaCard({ idea, index }: { idea: Idea; index: number }) {
  const [copied, setCopied] = useState(false)
  const { badge, bar } = urgencyStyle(idea.urgencia)
  const gradient = cardGradient(idea.formato)

  function copy() {
    const text = `📌 ${idea.titulo}\n\nHook: "${idea.hook}"\n\nÂngulo: ${idea.angulo}\n\nFormato: ${idea.formato}\n\nPor que vai performar: ${idea.porque}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`flex flex-col rounded-2xl p-5 border bg-gradient-to-br ${gradient} hover:scale-[1.015] transition-all duration-300`}
      style={{ animation: `fadeInUp 0.5s ease ${index * 70}ms both` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${badge}`}>
          <Flame className="w-3 h-3" />
          {idea.urgencia}/10
        </span>
        <span className="text-[11px] text-[#5a5a7a] font-semibold tracking-wide uppercase">{idea.formato}</span>
      </div>

      {/* Urgency bar */}
      <div className="h-0.5 rounded-full bg-white/5 mb-4 overflow-hidden">
        <div className={`h-full ${bar} rounded-full`} style={{ width: `${idea.urgencia * 10}%` }} />
      </div>

      {/* Title */}
      <h3 className="font-bold text-[#f1f1f8] text-base leading-snug mb-3">{idea.titulo}</h3>

      {/* Hook */}
      <div className="rounded-xl p-3 bg-[#0a0a14]/60 border border-white/5 mb-4 flex-1">
        <p className="text-[10px] text-iara-400 font-bold uppercase tracking-widest mb-1.5">Hook de abertura</p>
        <p className="text-sm text-[#c4c4d8] leading-relaxed italic">"{idea.hook}"</p>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4 text-xs">
        <div>
          <span className="text-[#4a4a6a] font-semibold">Ângulo: </span>
          <span className="text-[#9b9bb5]">{idea.angulo}</span>
        </div>
        <div>
          <span className="text-[#4a4a6a] font-semibold">Por que vai performar: </span>
          <span className="text-[#9b9bb5]">{idea.porque}</span>
        </div>
      </div>

      {/* Copy */}
      <button
        onClick={copy}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-[#6b6b8a] border border-white/6 hover:border-iara-700/40 hover:text-iara-400 hover:bg-iara-900/20 transition-all"
      >
        {copied
          ? <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copiado!</span></>
          : <><Copy className="w-3.5 h-3.5" /> Copiar tema</>}
      </button>
    </div>
  )
}

function IdeasSkeleton() {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-iara-400 animate-pulse" />
        <p className="text-xs font-bold text-[#6b6b8a] uppercase tracking-widest">Gerando suas ideias...</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-2xl border border-iara-900/40 bg-[#0f0f1e] p-5"
            style={{ animation: `pulse 1.8s ease-in-out ${i * 200}ms infinite` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="h-6 w-16 rounded-lg bg-[#1a1a2e]" />
              <div className="h-4 w-20 rounded bg-[#1a1a2e]" />
            </div>
            <div className="h-0.5 rounded-full bg-[#1a1a2e] mb-4" />
            <div className="h-5 w-3/4 rounded bg-[#1a1a2e] mb-2" />
            <div className="h-5 w-1/2 rounded bg-[#1a1a2e] mb-4" />
            <div className="rounded-xl p-3 bg-[#0a0a14]/60 border border-white/5 mb-4 space-y-2">
              <div className="h-3 w-20 rounded bg-[#1a1a2e]" />
              <div className="h-4 w-full rounded bg-[#1a1a2e]" />
              <div className="h-4 w-4/5 rounded bg-[#1a1a2e]" />
            </div>
            <div className="h-9 rounded-xl bg-[#1a1a2e]" />
          </div>
        ))}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-iara-500/60"
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-white leading-relaxed"
          style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
          {msg.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center flex-shrink-0 shadow-lg shadow-iara-900/40 mt-0.5">
        <Sparkles className="w-4 h-4 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        {msg.streaming && !msg.content && !msg.generatingIdeas ? (
          <div className="rounded-2xl rounded-tl-sm bg-[#0f0f1e] border border-[#1a1a2e] w-fit">
            <TypingDots />
          </div>
        ) : (
          <>
            {msg.content && (
              <div className="rounded-2xl rounded-tl-sm bg-[#0f0f1e] border border-[#1a1a2e] px-4 py-3 text-sm text-[#c4c4d8] leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>
            )}

            {/* Skeleton enquanto ideias são geradas */}
            {msg.generatingIdeas && !msg.ideas && <IdeasSkeleton />}

            {/* Ideas board */}
            {msg.ideas && msg.ideas.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-4 h-4 text-iara-400" />
                  <p className="text-xs font-bold text-[#6b6b8a] uppercase tracking-widest">
                    {msg.ideas.length} ideias geradas para você
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {msg.ideas.map((idea, i) => (
                    <IdeaCard key={i} idea={idea} index={i} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────── FIRST MESSAGE ────────────────────────── */

const OPENING: Message = {
  role: 'assistant',
  content: 'Oi! Vou te ajudar a encontrar os temas certos para explodir de vez. 🔥\n\nAntes de gerar as ideias, preciso te entender. Qual foi o seu último post que mais engajou — o tema, não o formato? Por que você acha que ele funcionou?',
}

/* ─────────────────────────── PAGE ─────────────────────────────────── */

export default function TemasPage() {
  const [messages, setMessages] = useState<Message[]>([OPENING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [limite, setLimite] = useState<number | null>(null)
  const [sessionSaved, setSessionSaved] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const hasIdeas = messages.some(m => m.ideas && m.ideas.length > 0)

  // Check remaining uses on mount
  useEffect(() => {
    fetch('/api/temas/salvar').then(r => r.json()).then(d => {
      if (d.restantes === 0) setLimitReached(true)
      if (d.limite) setLimite(d.limite)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    setInput('')
    setLoading(true)

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)

    // Add empty assistant message (streaming placeholder)
    const placeholderIdx = newMessages.length
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }])

    try {
      // Anthropic requires messages to start with 'user' — drop any leading assistant messages
      const firstUserIdx = newMessages.findIndex(m => m.role === 'user')
      const apiMessages = newMessages.slice(firstUserIdx).map(m => ({
        role: m.role,
        content: m.content + (m.ideas ? '\n\n```ideas\n' + JSON.stringify(m.ideas) + '\n```' : ''),
      }))

      const res = await fetch('/api/temas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!res.ok) throw new Error('Erro na API')
      if (!res.body) throw new Error('Sem stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let raw = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          // SDK toReadableStream() emits raw JSON lines (no 'data: ' prefix)
          const jsonStr = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed
          if (jsonStr === '[DONE]') continue
          try {
            const parsed = JSON.parse(jsonStr)
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              raw += parsed.delta.text
              const { text, ideas } = parseIdeas(raw)
              const hasStartedIdeas = raw.includes('```ideas')
              // Esconde o JSON parcial — mostra só o texto antes do bloco
              const displayText = hasStartedIdeas && !ideas
                ? raw.slice(0, raw.indexOf('```ideas')).trim()
                : text
              setMessages(prev => {
                const updated = [...prev]
                updated[placeholderIdx] = {
                  role: 'assistant',
                  content: displayText,
                  ideas: ideas ?? undefined,
                  streaming: true,
                  generatingIdeas: hasStartedIdeas && !ideas,
                }
                return updated
              })
            }
          } catch { /* partial JSON / non-JSON lines */ }
        }
      }

      // Finalize
      const { text, ideas } = parseIdeas(raw)
      setMessages(prev => {
        const updated = [...prev]
        updated[placeholderIdx] = { role: 'assistant', content: text, ideas: ideas ?? undefined, streaming: false }
        return updated
      })

      // Save usage when ideas are generated for the first time in this session
      if (ideas && ideas.length > 0 && !sessionSaved) {
        setSessionSaved(true)
        fetch('/api/temas/salvar', { method: 'POST' }).then(async r => {
          if (r.status === 429) setLimitReached(true)
        }).catch(() => {})
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[placeholderIdx] = {
          role: 'assistant',
          content: 'Ops, algo deu errado. Pode tentar de novo?',
          streaming: false,
        }
        return updated
      })
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, loading, messages])

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function reset() {
    setMessages([OPENING])
    setInput('')
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const suggestions = [
    'Quero ideias para Reels virais',
    'Me dá temas para carrossel de alto engajamento',
    'Gera as ideias agora',
  ]

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>

      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-iara-600/30 to-accent-purple/20 border border-iara-700/30 flex items-center justify-center">
                <Lightbulb className="w-4.5 h-4.5 w-[18px] h-[18px] text-iara-400" />
              </div>
              <h1 className="text-2xl font-bold text-[#f1f1f8]">Faísca Criativa</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-iara-400 bg-iara-950/60 border border-iara-700/40 uppercase tracking-wider">
                IA
              </span>
            </div>
            <p className="text-sm text-[#6b6b8a] max-w-lg">
              Me conta sobre o seu conteúdo. Eu extraio o que funciona no seu nicho e gero ideias de temas personalizadas, com hook e ângulo prontos.
            </p>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1a1a2e] text-sm text-[#6b6b8a] hover:text-[#f1f1f8] hover:border-iara-700/40 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Nova sessão
          </button>
        </div>

        {/* ── Chat messages ──────────────────────────────────────── */}
        <div className="flex-1 space-y-5 mb-4">
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* ── Quick suggestions (only before first user msg) ──────── */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50) }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-[#9b9bb5] border border-[#1a1a2e] hover:border-iara-700/40 hover:text-iara-400 hover:bg-iara-900/20 transition-all"
              >
                <Zap className="w-3 h-3 text-iara-500/60" />
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── Prompt: generate if not yet ─────────────────────────── */}
        {messages.length >= 5 && !hasIdeas && !loading && (
          <button
            onClick={() => { setInput('Gera as ideias agora com base no que falei'); setTimeout(send, 50) }}
            className="flex items-center justify-center gap-2 w-full py-3 mb-4 rounded-2xl text-sm font-bold text-iara-300 border border-iara-700/40 bg-iara-900/20 hover:bg-iara-900/40 transition-all animate-fade-in"
          >
            <Lightbulb className="w-4 h-4" />
            Gerar minhas ideias agora
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* ── Limit reached banner ────────────────────────────────── */}
        {limitReached && (
          <div className="rounded-2xl border border-red-800/30 bg-red-950/20 p-4 mb-4 flex items-start gap-3 animate-fade-in">
            <Zap className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#f1f1f8] mb-0.5">
                Limite de sessões atingido ({limite ?? '—'}/mês no plano gratuito)
              </p>
              <p className="text-xs text-[#6b6b8a]">
                Faça upgrade para continuar gerando ideias ilimitadas.
              </p>
            </div>
            <a href="/#planos"
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
              Ver planos
            </a>
          </div>
        )}

        {/* ── Input ───────────────────────────────────────────────── */}
        <div className="sticky bottom-0 bg-[#0a0a14] pt-3 pb-1">
          <div className={`flex gap-3 items-end rounded-2xl border bg-[#0f0f1e] p-3 transition-all ${limitReached ? 'border-red-900/30 opacity-50 pointer-events-none' : 'border-[#1a1a2e] focus-within:border-iara-700/50'}`}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={limitReached ? 'Limite de sessões atingido — faça upgrade' : hasIdeas ? 'Quer detalhar alguma ideia? Ou pedir mais temas?' : 'Responda a pergunta da Iara...'}
              rows={1}
              disabled={loading || limitReached}
              className="flex-1 bg-transparent resize-none text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:outline-none leading-relaxed min-h-[24px] max-h-[120px] overflow-y-auto disabled:opacity-50"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading || limitReached}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.08] active:scale-95"
              style={{ background: input.trim() && !loading && !limitReached ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'rgba(30,30,50,0.8)' }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          {!limitReached && (
            <p className="text-[10px] text-[#2a2a3a] text-center mt-2">
              Enter para enviar · Shift+Enter para nova linha
            </p>
          )}
        </div>
      </div>
    </>
  )
}
