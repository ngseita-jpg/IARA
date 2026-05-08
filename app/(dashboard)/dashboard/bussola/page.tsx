'use client'

import { useEffect, useState } from 'react'
import {
  Compass, Target, Sparkles, Loader2, Check, Edit3, AlertCircle,
  TrendingUp, Rocket, Flame, Crown, ChevronRight,
} from 'lucide-react'

type Missao = { texto: string; concluida: boolean; criada_em: string }
type SemanaMissoes = { semana: number; missoes: Missao[] }
type FaseAtual = 'construindo' | 'crescendo' | 'monetizando' | 'escalando'

type Plano = {
  id: string
  diferencial: string | null
  audiencia_alvo: string | null
  marco_3m: string | null
  marco_1a: string | null
  marco_3a: string | null
  fase_atual: FaseAtual
  missoes: SemanaMissoes[]
  raciocinio_ia: string | null
  trimestre: string | null
  atualizado_em: string
}

const FASE_INFO: Record<FaseAtual, { label: string; icon: typeof Compass; color: string; desc: string }> = {
  construindo: { label: 'Construindo autoridade', icon: Flame, color: 'amber', desc: 'Foco em provar competência' },
  crescendo:   { label: 'Crescendo base',         icon: TrendingUp, color: 'iara', desc: 'Foco em alcance e seguidores' },
  monetizando: { label: 'Monetizando',            icon: Rocket, color: 'pink', desc: 'Foco em conversão pra produto/serviço' },
  escalando:   { label: 'Escalando',              icon: Crown, color: 'violet', desc: 'Foco em sistema, time, leverage' },
}

export default function BussolaPage() {
  const [plano, setPlano] = useState<Plano | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [progressoMsg, setProgressoMsg] = useState('')

  // Form da entrevista (quando user nao tem plano ainda)
  const [respostaOnde, setRespostaOnde] = useState('')
  const [respostaObstaculo, setRespostaObstaculo] = useState('')
  const [respostaDiferencial, setRespostaDiferencial] = useState('')
  const [respostaAudiencia, setRespostaAudiencia] = useState('')

  useEffect(() => {
    fetch('/api/bussola')
      .then(r => r.json())
      .then(d => {
        setPlano(d.plano ?? null)
        setCarregando(false)
      })
      .catch(() => setCarregando(false))
  }, [])

  async function gerarPlano() {
    if (!respostaOnde.trim()) {
      setErro('Conta onde você quer chegar daqui 1 ano — sem isso a Iara não consegue traçar a rota.')
      return
    }
    setGerando(true)
    setErro(null)

    const mensagens = [
      'Lendo seu perfil e métricas atuais...',
      'Cruzando suas respostas com o nicho...',
      'Definindo marcos realistas mas agressivos...',
      'Traçando 4 semanas de missões concretas...',
      'Quase lá — calibrando o plano...',
    ]
    let mIdx = 0
    setProgressoMsg(mensagens[0])
    const iv = setInterval(() => {
      mIdx = (mIdx + 1) % mensagens.length
      setProgressoMsg(mensagens[mIdx])
    }, 3500)

    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 100_000)

      const res = await fetch('/api/bussola/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onde_quer_chegar: respostaOnde,
          maior_obstaculo: respostaObstaculo,
          o_que_diferencia: respostaDiferencial,
          quem_e_audiencia: respostaAudiencia,
        }),
        signal: ctrl.signal,
      })
      clearTimeout(timer)

      const data = await res.json().catch(() => ({}))

      if (res.status === 422) {
        setErro(data.mensagem || 'Persona incompleta')
        return
      }
      if (!res.ok) {
        const baseMsg = data.mensagem || data.error || 'Erro inesperado'
        setErro(data.detalhe ? `${baseMsg} [${data.detalhe}]` : baseMsg)
        return
      }
      setPlano(data.plano)
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        setErro('Demorou mais que 100s. A IA pode estar sobrecarregada — tenta de novo.')
      } else {
        setErro('Falha de conexão. Verifica internet e tenta de novo.')
      }
    } finally {
      clearInterval(iv)
      setGerando(false)
      setProgressoMsg('')
    }
  }

  async function toggleMissao(semana: number, indice: number) {
    if (!plano) return
    // Optimistic update
    const novasMissoes = plano.missoes.map(s =>
      s.semana === semana
        ? { ...s, missoes: s.missoes.map((m, i) => i === indice ? { ...m, concluida: !m.concluida } : m) }
        : s
    )
    setPlano({ ...plano, missoes: novasMissoes })
    await fetch('/api/bussola', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ semana, indice }),
    })
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-iara-400" />
      </div>
    )
  }

  // ESTADO 1: sem plano — entrevista inicial
  if (!plano) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-iara-400 text-sm font-medium mb-2">
            <Compass className="w-4 h-4" />
            <span>Módulo</span>
          </div>
          <h1 className="text-3xl font-bold text-[#f1f1f8]">
            Sua <span className="iara-gradient-text">Bússola</span>
          </h1>
          <p className="mt-2 text-[#9b9bb5] text-sm leading-relaxed">
            Direcionamento estratégico pros próximos 3 meses + missões concretas semana a semana.
            A Iara traça o plano, você executa. Outras áreas do app vão se alinhar automaticamente ao seu marco.
          </p>
        </div>

        <div className="iara-card p-6 mb-6">
          <p className="text-xs uppercase tracking-widest text-iara-400 font-bold mb-4">
            Entrevista rápida (4 perguntas)
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#f1f1f8] mb-2">
                1. Onde você quer chegar daqui 1 ano? <span className="text-red-400">*</span>
              </label>
              <textarea
                value={respostaOnde}
                onChange={e => setRespostaOnde(e.target.value)}
                placeholder="Ex: 'Ter 50k seguidores no Instagram + lançar meu primeiro curso digital + R$10k/mês de side income'"
                className="iara-input w-full min-h-[80px]"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#f1f1f8] mb-2">
                2. Qual é o seu maior obstáculo HOJE?
              </label>
              <textarea
                value={respostaObstaculo}
                onChange={e => setRespostaObstaculo(e.target.value)}
                placeholder="Ex: 'Não consigo manter consistência' ou 'Engajo pouco' ou 'Não sei como monetizar'"
                className="iara-input w-full min-h-[60px]"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#f1f1f8] mb-2">
                3. O que te diferencia de outros do seu nicho?
              </label>
              <textarea
                value={respostaDiferencial}
                onChange={e => setRespostaDiferencial(e.target.value)}
                placeholder="Ex: 'Sou advogado E faço comédia, ninguém une os dois' / 'Vivi a transformação que ensino'"
                className="iara-input w-full min-h-[60px]"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#f1f1f8] mb-2">
                4. Quem é a sua audiência ideal? (concreto: idade, situação, dor)
              </label>
              <textarea
                value={respostaAudiencia}
                onChange={e => setRespostaAudiencia(e.target.value)}
                placeholder="Ex: 'Mulher 28-40 que quer empreender mas trava no medo' / 'Pai de família com dívidas no cartão'"
                className="iara-input w-full min-h-[60px]"
                rows={2}
              />
            </div>
          </div>

          <button
            onClick={gerarPlano}
            disabled={gerando}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-iara-500 to-accent-purple text-white text-sm font-bold disabled:opacity-50 transition active:scale-95 shadow-lg shadow-iara-900/40"
          >
            {gerando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="truncate">{progressoMsg || 'Gerando...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Traçar minha Bússola
              </>
            )}
          </button>

          {erro && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          <p className="mt-4 text-[10px] text-[#5a5a7a] text-center">
            Quanto mais específico você for, mais cirúrgico o plano. ~30s pra gerar.
          </p>
        </div>
      </div>
    )
  }

  // ESTADO 2: tem plano — mostra dashboard da Bússola
  const fase = FASE_INFO[plano.fase_atual]
  const FaseIcon = fase.icon
  const totalMissoes = plano.missoes.reduce((acc, s) => acc + s.missoes.length, 0)
  const concluidas = plano.missoes.reduce((acc, s) => acc + s.missoes.filter(m => m.concluida).length, 0)
  const progressoPct = totalMissoes > 0 ? Math.round((concluidas / totalMissoes) * 100) : 0

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-iara-400 text-sm font-medium mb-2">
          <Compass className="w-4 h-4" />
          <span>{plano.trimestre ?? 'Plano atual'}</span>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[#f1f1f8]">
              Sua <span className="iara-gradient-text">Bússola</span>
            </h1>
            {plano.raciocinio_ia && (
              <p className="mt-2 text-sm text-[#9b9bb5] max-w-2xl leading-relaxed italic">
                "{plano.raciocinio_ia}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Card da Fase Atual */}
      <div className={`iara-card p-5 mb-6 border-${fase.color}-700/40 bg-gradient-to-br from-${fase.color}-950/30 to-iara-950/20`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-xl bg-${fase.color}-600/30 border border-${fase.color}-500/40 flex items-center justify-center`}>
            <FaseIcon className={`w-5 h-5 text-${fase.color}-300`} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-iara-400/80 font-bold">Fase atual</p>
            <p className="text-base font-bold text-[#f1f1f8]">{fase.label}</p>
          </div>
        </div>
        <p className="text-xs text-[#9b9bb5]">{fase.desc}</p>
      </div>

      {/* Marcos */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: '3 meses', valor: plano.marco_3m, cor: 'iara' },
          { label: '1 ano', valor: plano.marco_1a, cor: 'accent-purple' },
          { label: '3 anos', valor: plano.marco_3a, cor: 'accent-pink' },
        ].map((m) => (
          <div key={m.label} className="iara-card p-4">
            <p className="text-[10px] uppercase tracking-widest text-iara-400/70 font-bold mb-1">{m.label}</p>
            <p className="text-sm text-[#f1f1f8] font-semibold leading-snug">{m.valor || '—'}</p>
          </div>
        ))}
      </div>

      {/* Identidade */}
      <div className="iara-card p-5 mb-6">
        <p className="text-[10px] uppercase tracking-widest text-iara-400/80 font-bold mb-3">Identidade</p>
        <div className="space-y-3 text-sm">
          {plano.diferencial && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#5a5a7a] font-semibold mb-1">Seu diferencial</p>
              <p className="text-[#dcdcec] leading-relaxed">{plano.diferencial}</p>
            </div>
          )}
          {plano.audiencia_alvo && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#5a5a7a] font-semibold mb-1">Pra quem você fala</p>
              <p className="text-[#dcdcec] leading-relaxed">{plano.audiencia_alvo}</p>
            </div>
          )}
        </div>
      </div>

      {/* Missoes */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-iara-400 font-bold">Missões da semana</p>
            <h2 className="text-lg font-bold text-[#f1f1f8] mt-1">4 semanas, {totalMissoes} missões</h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black iara-gradient-text">{progressoPct}%</p>
            <p className="text-[10px] text-[#5a5a7a]">{concluidas}/{totalMissoes} concluídas</p>
          </div>
        </div>

        <div className="space-y-3">
          {plano.missoes.map((sem) => (
            <div key={sem.semana} className="iara-card p-4">
              <p className="text-xs uppercase tracking-wider text-iara-400/80 font-bold mb-3">Semana {sem.semana}</p>
              <div className="space-y-2">
                {sem.missoes.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => toggleMissao(sem.semana, i)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl bg-[#0a0a14] border border-[#1a1a2e] hover:border-iara-700/40 transition-colors text-left group"
                  >
                    <div className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      m.concluida
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-[#3a3a5a] group-hover:border-iara-500'
                    }`}>
                      {m.concluida && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`flex-1 text-sm leading-relaxed ${
                      m.concluida ? 'text-[#5a5a7a] line-through' : 'text-[#dcdcec]'
                    }`}>
                      {m.texto}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Refazer plano */}
      <div className="iara-card p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#f1f1f8]">Mudou de rumo?</p>
          <p className="text-xs text-[#5a5a7a] mt-0.5">Gere um novo plano (o atual vira histórico)</p>
        </div>
        <button
          onClick={() => setPlano(null)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-iara-700/40 text-iara-400 text-xs font-medium hover:bg-iara-900/30 transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Refazer
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
