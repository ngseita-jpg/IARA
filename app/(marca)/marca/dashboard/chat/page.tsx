'use client'

import { useState, useRef, useEffect } from 'react'
import { TrendingUp, Send, Loader2, RotateCcw, Lightbulb } from 'lucide-react'
type HistoricoMsg = { role: 'user' | 'assistant'; content: string }

type Mensagem = {
  role: 'user' | 'assistant'
  content: string
}

const SUGESTOES = [
  'Quais tipos de criadores combinam melhor com minha marca?',
  'Como calcular o ROI de uma campanha de influência?',
  'Como criar um briefing eficaz para criadores?',
  'Quanto devo pagar por post para micro-influenciadores?',
  'Como medir o sucesso de uma campanha de influencer marketing?',
  'Qual a diferença entre mega, macro e micro-influenciadores?',
]

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('## '))
          return <h2 key={i} className="text-sm font-bold text-[#f1f1f8] mt-4 mb-1 first:mt-0">{line.slice(3)}</h2>
        if (line.startsWith('### '))
          return <h3 key={i} className="text-xs font-bold text-[#E2C068] mt-3 mb-1">{line.slice(4)}</h3>
        if (line.startsWith('- '))
          return (
            <div key={i} className="flex gap-2 text-sm text-[#c9c9d8]">
              <span className="text-[#C9A84C] mt-0.5 flex-shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#f1f1f8]">$1</strong>') }} />
            </div>
          )
        if (line.trim() === '') return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm text-[#c9c9d8] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#f1f1f8]">$1</strong>') }} />
        )
      })}
    </div>
  )
}

export default function ChatEstrategicoPage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const [carregando, setCarregando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, carregando])

  async function enviar(texto?: string) {
    const msg = (texto ?? input).trim()
    if (!msg || carregando) return
    setInput('')

    const novasMensagens: Mensagem[] = [...mensagens, { role: 'user', content: msg }]
    setMensagens(novasMensagens)
    setCarregando(true)

    const historico: HistoricoMsg[] = novasMensagens.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const res = await fetch('/api/marca/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: msg, historico }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido')
      setMensagens(prev => [...prev, { role: 'assistant', content: data.resposta }])
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Erro ao conectar com a IA'
      setMensagens(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}` }])
    } finally {
      setCarregando(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function reiniciar() {
    setMensagens([])
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  const vazio = mensagens.length === 0

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-h-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #a855f7)' }}>
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#f1f1f8]">Chat Estratégico</h1>
            <p className="text-xs text-[#6b6b8a]">Consultoria de marketing com IA Iara</p>
          </div>
        </div>
        {!vazio && (
          <button onClick={reiniciar} className="flex items-center gap-1.5 text-xs text-[#6b6b8a] hover:text-[#E2C068] transition-colors cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5" />
            Nova conversa
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-[#1a1a2e] bg-[#0a0a14] p-4 space-y-4 mb-3">
        {vazio ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(168,85,247,0.15))' }}>
              <TrendingUp className="w-7 h-7 text-[#C9A84C]" />
            </div>
            <h2 className="text-base font-bold text-[#f1f1f8] mb-1">Sua consultora de marketing está pronta</h2>
            <p className="text-sm text-[#6b6b8a] mb-6 max-w-sm leading-relaxed">
              Pergunte sobre estratégia de campanhas, escolha de criadores, briefings, ROI ou qualquer dúvida de marketing de influência.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGESTOES.map(s => (
                <button key={s} onClick={() => enviar(s)}
                  className="text-left text-xs text-[#9b9bb5] hover:text-[#f1f1f8] border border-[#1a1a2e] hover:border-[#C9A84C]/30 rounded-xl px-3 py-2.5 transition-all bg-[#0f0f1e] hover:bg-[#13131f] cursor-pointer">
                  <Lightbulb className="w-3 h-3 inline mr-1.5 text-[#C9A84C]" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {mensagens.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mr-2 mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #C9A84C, #a855f7)' }}>
                    <TrendingUp className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  m.role === 'user'
                    ? 'bg-[#1a1a2e] text-[#f1f1f8] text-sm'
                    : 'bg-[#13131f] border border-[#1a1a2e]'
                }`}>
                  {m.role === 'user'
                    ? <p className="text-sm leading-relaxed">{m.content}</p>
                    : <MarkdownText text={m.content} />
                  }
                </div>
              </div>
            ))}
            {carregando && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mr-2"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #a855f7)' }}>
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-[#13131f] border border-[#1a1a2e] rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 flex gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte sobre estratégia, criadores, briefing, ROI..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-[#1a1a2e] bg-[#0f0f1e] px-4 py-3 text-sm text-[#f1f1f8] placeholder-[#3a3a5a] focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
          style={{ minHeight: 48, maxHeight: 120 }}
          disabled={carregando}
        />
        <button
          onClick={() => enviar()}
          disabled={!input.trim() || carregando}
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #C9A84C, #a855f7)' }}
        >
          {carregando ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
        </button>
      </div>
    </div>
  )
}
