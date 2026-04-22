'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown, MessageCircle, Mail, ArrowLeft,
  Send, Loader2, CheckCircle2, Sparkles, HelpCircle,
} from 'lucide-react'
import { IaraLogo } from '@/components/iara-logo'

type FaqItem = { q: string; a: string; cat: string }

const FAQ: FaqItem[] = [
  // Conta
  { cat: 'Conta', q: 'Como crio minha conta?',
    a: 'Acesse iarahubapp.com.br/register, escolha se é criador ou marca, preencha nome, email e senha. Confirma o email e já cai no onboarding de 3 passos pra configurar sua Persona IA.' },
  { cat: 'Conta', q: 'Esqueci minha senha, como recupero?',
    a: 'Na tela de login clica em "Esqueceu a senha?". Você recebe um email com link de reset, válido por 1 hora.' },
  { cat: 'Conta', q: 'Posso trocar meu nome, nicho ou tom de voz depois?',
    a: 'Sim. Em "Minha Conta" → "Persona IA", você edita tudo a qualquer momento. A Iara passa a usar os novos dados nas próximas gerações.' },
  { cat: 'Conta', q: 'Como faço para sair da minha conta em um dispositivo?',
    a: 'No dashboard, canto inferior esquerdo (desktop) ou menu "Mais" (mobile), clica em "Sair". Também pode entrar em "Minha Conta" → "Sair".' },

  // Pagamento
  { cat: 'Pagamento', q: 'Quais formas de pagamento vocês aceitam?',
    a: 'Cartão de crédito, cartão de débito e boleto bancário. PIX está em liberação pelo Stripe — assim que disponível, avisamos.' },
  { cat: 'Pagamento', q: 'Como cancelo minha assinatura?',
    a: 'Em "Minha Conta" → "Gerenciar" (abre o portal do Stripe). Cancela em 1 clique, vale até o fim do ciclo atual. Sem multa.' },
  { cat: 'Pagamento', q: 'Posso trocar de plano?',
    a: 'Sim. Em "Minha Conta" → "Gerenciar" você pode fazer upgrade ou downgrade. Upgrade vale imediatamente com ajuste proporcional; downgrade entra em vigor no próximo ciclo.' },
  { cat: 'Pagamento', q: 'O plano anual tem desconto?',
    a: 'Sim — 25% de desconto no anual em qualquer plano. Cobrado uma vez no ano.' },
  { cat: 'Pagamento', q: 'Tem teste grátis ou período de garantia?',
    a: 'Temos plano Free permanente (sem cartão, sem prazo) pra você testar o produto. Nos planos pagos não há reembolso, mas cancela a qualquer momento sem multa.' },
  { cat: 'Pagamento', q: 'Vocês emitem nota fiscal?',
    a: 'Todos os pagamentos são processados pelo Stripe Brasil e o recibo fica no seu email + portal de assinatura. Para NF específica do seu CNPJ, abre um ticket que resolvemos.' },

  // Módulos
  { cat: 'Módulos', q: 'Quantas gerações por mês cada plano dá?',
    a: 'Free: 3 roteiros, 2 carrosseis/thumbs/stories. Plus: 10 roteiros, 7 carrosseis/thumbs/stories. Premium: 20 roteiros, 18 carrosseis/thumbs/stories + métricas com IA. Profissional: TUDO ilimitado.' },
  { cat: 'Módulos', q: 'Editar o conteúdo depois que é gerado consome cota?',
    a: 'NÃO. Depois de gerar, você pode editar texto, cor, fonte, destacar palavras etc. à vontade — só a primeira geração consome cota.' },
  { cat: 'Módulos', q: 'Quanto tempo demora cada geração?',
    a: 'Roteiro 30–60s · Carrossel 60–90s · Thumbnail 20–30s · Análise de oratória ~15s. Em horário de pico pode levar um pouco mais.' },
  { cat: 'Módulos', q: 'As imagens e conteúdos gerados são meus?',
    a: 'Sim, 100%. Tudo que você gera é seu para usar comercialmente, postar, imprimir, vender como quiser.' },
  { cat: 'Módulos', q: 'A Iara aprende com o meu estilo?',
    a: 'Sim. Quanto mais você preenche a Persona IA (nicho, tom, plataformas, objetivos) e gera conteúdo, mais a Iara entende seu jeito. Premium e Profissional têm contexto mais profundo.' },
  { cat: 'Módulos', q: 'Posso colar um link de YouTube e ela transforma em carrossel?',
    a: 'Sim. No Carrossel e no Roteiros, você cola link de vídeo, artigo ou texto e a Iara extrai o conteúdo base para transformar no formato escolhido.' },
  { cat: 'Módulos', q: 'Quantas fontes o thumbnail tem?',
    a: '17 fontes categorizadas (Impacto, Sans, Serif e Script), com preview real. Depois de gerar, você ainda pode trocar a cor do título inteiro ou só de palavras específicas.' },

  // Afiliação / Parceria
  { cat: 'Afiliação', q: 'Como funciona o programa de afiliados?',
    a: 'Você gera seu link exclusivo de indicação. Embaixador (10+ indicações): 15% recorrente. Parceiro (30+): 20%. Elite (50+): 25% + bônus trimestral. Pagamento via PIX todo dia 10.' },
  { cat: 'Afiliação', q: 'O que é a afiliação de produtos de marcas?',
    a: 'Marcas cadastram produtos no catálogo. Você escolhe os que fazem sentido pro seu nicho, gera link/cupom exclusivo, e recebe comissão por cada venda rastreada. Split: 90% criador, 10% Iara Hub.' },

  // Técnico
  { cat: 'Técnico', q: 'Meus dados ficam seguros?',
    a: 'Sim. Hospedados no Supabase (criptografia em repouso), autenticação com tokens, conformidade com LGPD. Você pode solicitar exclusão completa dos seus dados a qualquer momento.' },
  { cat: 'Técnico', q: 'Posso usar no celular?',
    a: 'Sim, 100% responsivo. Basta acessar iarahubapp.com.br pelo navegador do celular. Logo teremos app nativo na App Store e Play Store.' },
  { cat: 'Técnico', q: 'Não consegui gerar, deu erro. O que faço?',
    a: 'Primeiro tenta de novo em 1 minuto (às vezes é só rede). Se persistir, tira um print, abre um ticket aqui mesmo descrevendo qual módulo e qual ação — a gente responde em até 24h.' },
]

const CATS = ['Todos', 'Conta', 'Pagamento', 'Módulos', 'Afiliação', 'Técnico']

type Msg = { role: 'user' | 'assistant'; content: string }

export function AjudaClient() {
  const [catFiltro, setCatFiltro] = useState<string>('Todos')
  const [abertoIdx, setAbertoIdx] = useState<number | null>(null)
  const [busca, setBusca] = useState('')

  const itensFiltrados = FAQ.filter(item => {
    const catOk = catFiltro === 'Todos' || item.cat === catFiltro
    const buscaOk = !busca || (item.q + item.a).toLowerCase().includes(busca.toLowerCase())
    return catOk && buscaOk
  })

  return (
    <div className="min-h-screen bg-[#08080f] text-[#f1f1f8] px-4 py-10 sm:py-16">
      {/* Header */}
      <header className="max-w-4xl mx-auto mb-10 sm:mb-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-[#9b9bb5] hover:text-[#f1f1f8] transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Voltar pro site
        </Link>
        <IaraLogo size="sm" layout="horizontal" />
      </header>

      <main className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-iara-700/30 text-[10px] font-semibold text-iara-300 mb-6 tracking-[0.22em] uppercase">
            <HelpCircle className="w-3 h-3" />
            Central de Ajuda
          </div>
          <h1 className="font-display font-black text-[clamp(36px,6vw,64px)] leading-[1.02] tracking-display mb-4 editorial-punct">
            Como podemos{' '}
            <span className="font-editorial font-normal text-iara-300/95">ajudar</span>{' '}
            você?
          </h1>
          <p className="text-[#9b9bb5] text-[clamp(15px,1.4vw,18px)] max-w-xl mx-auto leading-relaxed">
            Busque nas perguntas frequentes, converse com a Iara direto, ou abra um ticket com nossa equipe humana.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Ex: como cancelo, quantas gerações por mês, troca de plano..."
            className="w-full rounded-2xl border border-[#1a1a2e] bg-[#0d0d1a] px-5 py-4 text-[15px] text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none focus:ring-2 focus:ring-iara-500/15 transition-all"
          />
        </div>

        {/* Cats */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATS.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFiltro(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                catFiltro === cat
                  ? 'bg-iara-600/25 border-iara-500/50 text-iara-200'
                  : 'bg-[#0d0d1a] border-[#1a1a2e] text-[#6b6b8a] hover:border-iara-700/40 hover:text-[#9b9bb5]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ */}
        <section className="space-y-2 mb-16">
          {itensFiltrados.length === 0 ? (
            <div className="text-center py-14 rounded-2xl border border-[#1a1a2e] bg-[#0d0d1a]/60">
              <p className="text-[#6b6b8a] text-sm">
                Nenhuma pergunta encontrada. Tenta conversar com a Iara abaixo ou abre um ticket.
              </p>
            </div>
          ) : (
            itensFiltrados.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[#1a1a2e] bg-[#0d0d1a]/60 overflow-hidden transition-colors hover:border-iara-700/30"
              >
                <button
                  onClick={() => setAbertoIdx(abertoIdx === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <div className="flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-iara-400 mb-1 inline-block">
                      {item.cat}
                    </span>
                    <p className="text-[15px] font-semibold text-[#f1f1f8] leading-snug">{item.q}</p>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-[#5a5a7a] flex-shrink-0 transition-transform ${abertoIdx === i ? 'rotate-180 text-iara-400' : ''}`}
                  />
                </button>
                {abertoIdx === i && (
                  <div className="px-5 pb-5 -mt-1 animate-fade-in">
                    <p className="text-[14px] text-[#9b9bb5] leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </section>

        {/* Chat com Iara */}
        <ChatIara />

        {/* Ticket */}
        <FormTicket />
      </main>

      <footer className="max-w-4xl mx-auto mt-20 pt-8 border-t border-white/5 text-center">
        <p className="text-[11px] text-[#3a3a5a] tracking-[0.18em] uppercase">
          © {new Date().getFullYear()} Iara Hub · Resposta em até 24h úteis
        </p>
      </footer>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   CHAT COM IARA
   ───────────────────────────────────────────────────────────── */
function ChatIara() {
  const [aberto, setAberto] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessaoId] = useState(() => `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, aberto])

  async function enviar() {
    const texto = input.trim()
    if (!texto || loading) return
    setMsgs(prev => [...prev, { role: 'user', content: texto }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/ajuda/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: texto, historico: msgs, sessao_id: sessaoId }),
      })
      const data = await res.json()
      if (data.resposta) {
        setMsgs(prev => [...prev, { role: 'assistant', content: data.resposta }])
      } else {
        setMsgs(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um problema agora. Tenta de novo ou abre um ticket abaixo.' }])
      }
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Erro de conexão. Tenta de novo ou abre um ticket abaixo.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-3xl border border-iara-700/25 bg-gradient-to-br from-iara-950/30 to-[#0d0d1a]/80 overflow-hidden mb-6">
      <button
        onClick={() => {
          setAberto(v => !v)
          if (!aberto && msgs.length === 0) {
            setMsgs([{ role: 'assistant', content: 'Oi! Sou a Iara. Qual é a sua dúvida? Posso explicar sobre planos, módulos, pagamento, afiliação ou qualquer outra coisa do produto.' }])
          }
        }}
        className="w-full flex items-center justify-between gap-4 p-6 text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center flex-shrink-0 shadow-lg shadow-iara-900/40">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-iara-400 mb-1">Resposta instantânea</p>
            <p className="text-[17px] font-bold text-[#f1f1f8]">Conversar com a Iara</p>
            <p className="text-[13px] text-[#9b9bb5]">Respostas sobre o produto em tempo real</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-[#5a5a7a] flex-shrink-0 transition-transform ${aberto ? 'rotate-180 text-iara-400' : ''}`} />
      </button>

      {aberto && (
        <div className="border-t border-iara-900/30 p-4 sm:p-6 animate-fade-in">
          <div className="max-h-[420px] overflow-y-auto space-y-3 mb-4 pr-2">
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-iara-600/20 border border-iara-700/30 text-[#f1f1f8]'
                      : 'bg-[#0a0a14] border border-[#1a1a2e] text-[#c1c1d8]'
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatText(m.content) }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div className="bg-[#0a0a14] border border-[#1a1a2e] px-4 py-3 rounded-2xl">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-iara-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-iara-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-iara-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
              }}
              placeholder="Digite sua pergunta... (Enter envia, Shift+Enter nova linha)"
              rows={1}
              className="flex-1 rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none resize-none max-h-32"
            />
            <button
              onClick={enviar}
              disabled={loading || !input.trim()}
              className="p-3 rounded-xl bg-gradient-to-r from-iara-500 to-accent-purple text-white disabled:opacity-40 transition-all hover:opacity-90"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-[#4a4a6a] mt-2">
            A Iara responde com base no conhecimento do produto. Para erros técnicos graves, abra um ticket abaixo.
          </p>
        </div>
      )}
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   FORMULÁRIO DE TICKET
   ───────────────────────────────────────────────────────────── */
function FormTicket() {
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [categoria, setCategoria] = useState('outro')
  const [assunto, setAssunto] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true); setErro(null)
    try {
      const res = await fetch('/api/ajuda/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, categoria, assunto, mensagem }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')
      setSucesso(data.ticket_id)
      setNome(''); setAssunto(''); setMensagem('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="rounded-3xl border border-[#1a1a2e] bg-[#0d0d1a]/60 overflow-hidden">
      <button
        onClick={() => setAberto(v => !v)}
        className="w-full flex items-center justify-between gap-4 p-6 text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1a1a2e] flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-[#9b9bb5]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6b6b8a] mb-1">Resposta em até 24h</p>
            <p className="text-[17px] font-bold text-[#f1f1f8]">Abrir ticket com nossa equipe</p>
            <p className="text-[13px] text-[#9b9bb5]">Para casos técnicos, financeiros ou específicos</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-[#5a5a7a] flex-shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div className="border-t border-[#1a1a2e] p-6 animate-fade-in">
          {sucesso ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <p className="font-bold text-[#f1f1f8] text-lg mb-1">Ticket #{sucesso} enviado!</p>
              <p className="text-sm text-[#9b9bb5] mb-4">Você vai receber a resposta no email <strong>{email}</strong> em até 24h úteis.</p>
              <button
                onClick={() => { setSucesso(null); setEmail('') }}
                className="text-iara-400 hover:text-iara-300 text-sm font-semibold"
              >
                Abrir outro ticket
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6b6b8a] mb-1.5 uppercase tracking-wider">Seu nome</label>
                  <input
                    required
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Como quer ser chamado"
                    className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6b6b8a] mb-1.5 uppercase tracking-wider">Email</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] mb-1.5 uppercase tracking-wider">Categoria</label>
                <select
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] focus:border-iara-500/60 focus:outline-none"
                >
                  <option value="conta">Conta</option>
                  <option value="pagamento">Pagamento / Assinatura</option>
                  <option value="modulo">Dúvida sobre módulo</option>
                  <option value="bug">Reportar bug</option>
                  <option value="sugestao">Sugestão / Feedback</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] mb-1.5 uppercase tracking-wider">Assunto</label>
                <input
                  required
                  maxLength={200}
                  value={assunto}
                  onChange={e => setAssunto(e.target.value)}
                  placeholder="Ex: Cancelar plano Plus, erro ao gerar carrossel, etc."
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6b6b8a] mb-1.5 uppercase tracking-wider">Mensagem</label>
                <textarea
                  required
                  rows={5}
                  maxLength={5000}
                  value={mensagem}
                  onChange={e => setMensagem(e.target.value)}
                  placeholder="Descreva sua dúvida ou problema. Se for erro técnico, conta o passo a passo e cola o print se puder."
                  className="w-full rounded-xl border border-[#1a1a2e] bg-[#0a0a14] px-4 py-3 text-sm text-[#f1f1f8] placeholder:text-[#3a3a5a] focus:border-iara-500/60 focus:outline-none resize-none"
                />
                <p className="text-[10px] text-[#4a4a6a] mt-1 text-right">{mensagem.length}/5000</p>
              </div>

              {erro && (
                <div className="px-4 py-3 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-sm">
                  ⚠ {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}
              >
                {enviando ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Send className="w-4 h-4" /> Enviar ticket</>}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  )
}

// Formatador simples: **bold** → <strong>, quebras de linha
function formatText(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}
