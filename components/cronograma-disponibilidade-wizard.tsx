'use client'

import { useState } from 'react'
import { CalendarClock, Check, Loader2, AlertCircle, ArrowRight } from 'lucide-react'

const DIAS = [
  { id: 'seg', label: 'Segunda' },
  { id: 'ter', label: 'Terça' },
  { id: 'qua', label: 'Quarta' },
  { id: 'qui', label: 'Quinta' },
  { id: 'sex', label: 'Sexta' },
  { id: 'sab', label: 'Sábado' },
  { id: 'dom', label: 'Domingo' },
]

const PERIODOS = [
  { id: 'manha_cedo', label: 'Manhã cedo (6-9h)', desc: 'Antes do trabalho' },
  { id: 'manha',      label: 'Manhã (9-12h)',     desc: 'Período comercial' },
  { id: 'almoco',     label: 'Almoço (12-14h)',   desc: 'Hora do almoço' },
  { id: 'tarde',      label: 'Tarde (14-18h)',    desc: 'Período comercial' },
  { id: 'noite',      label: 'Noite (18-22h)',    desc: 'Pós-trabalho' },
  { id: 'madrugada',  label: 'Madrugada (22h+)',  desc: 'Antes de dormir' },
]

const MINUTOS = [
  { val: 15, label: '15 min',  desc: 'Pouco tempo, posts curtos' },
  { val: 30, label: '30 min',  desc: 'Tempo padrão' },
  { val: 60, label: '1h',      desc: 'Posso editar com calma' },
  { val: 90, label: '1h30+',   desc: 'Trabalho dedicado em conteúdo' },
]

type Props = {
  onConcluir: () => void  // chamado depois de salvar — calendario regenera estado vazio
  inicialDias?: string[]
  inicialPeriodos?: string[]
  inicialMinutos?: number | null
  inicialCompromissos?: string | null
}

export function CronogramaDisponibilidadeWizard({
  onConcluir, inicialDias = [], inicialPeriodos = [], inicialMinutos = null, inicialCompromissos = '',
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [dias, setDias] = useState<string[]>(inicialDias)
  const [periodos, setPeriodos] = useState<string[]>(inicialPeriodos)
  const [minutos, setMinutos] = useState<number | null>(inicialMinutos)
  const [compromissos, setCompromissos] = useState(inicialCompromissos ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function toggleDia(d: string) {
    setDias(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }
  function togglePeriodo(p: string) {
    setPeriodos(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function salvar() {
    if (dias.length === 0 || periodos.length === 0 || !minutos) {
      setErro('Preencha todos os campos pra Iara não inventar horários impossíveis.')
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      const res = await fetch('/api/perfil/disponibilidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disponibilidade_dias: dias,
          disponibilidade_periodos: periodos,
          disponibilidade_minutos: minutos,
          disponibilidade_compromissos: compromissos.trim() || null,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setErro(body.error || `Erro ${res.status} salvando disponibilidade`)
        setSalvando(false)
        return
      }
      onConcluir()
    } catch {
      setErro('Falha de conexão. Tenta de novo.')
      setSalvando(false)
    }
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-iara-900/40 via-accent-purple/15 to-accent-pink/10 border border-iara-700/40 p-6 sm:p-8 mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-iara-600/30 border border-iara-500/40 flex items-center justify-center">
          <CalendarClock className="w-5 h-5 text-iara-300" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-iara-400">Passo {step} de 3</p>
          <h2 className="text-lg font-bold text-white">
            {step === 1 ? 'Quais dias você consegue postar?' :
             step === 2 ? 'Em qual período do dia?' :
             'Quanto tempo livre por dia?'}
          </h2>
        </div>
      </div>
      <p className="text-xs text-iara-200/70 mb-5">
        Sem isso a Iara inventaria horários que não cabem na sua rotina. <strong className="text-iara-200">Preenche uma vez só.</strong>
      </p>

      {/* PASSO 1: Dias */}
      {step === 1 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {DIAS.map(d => {
              const ativo = dias.includes(d.id)
              return (
                <button
                  key={d.id}
                  onClick={() => toggleDia(d.id)}
                  className={`p-3 min-h-14 rounded-xl border text-sm font-semibold transition-all active:scale-95 ${
                    ativo
                      ? 'border-iara-500 bg-iara-600/30 text-white'
                      : 'border-[#2a2a4a] bg-[#0d0d1a] text-[#9b9bb5] hover:border-iara-700/40'
                  }`}
                >
                  {d.label}
                </button>
              )
            })}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => dias.length > 0 ? setStep(2) : setErro('Marque ao menos 1 dia')}
              className="flex items-center gap-2 px-5 min-h-12 rounded-xl bg-gradient-to-r from-iara-500 to-accent-purple text-white text-sm font-bold active:scale-95 transition shadow-lg"
            >
              Próximo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* PASSO 2: Períodos */}
      {step === 2 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            {PERIODOS.map(p => {
              const ativo = periodos.includes(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => togglePeriodo(p.id)}
                  className={`p-3 rounded-xl border text-left transition-all active:scale-95 ${
                    ativo
                      ? 'border-iara-500 bg-iara-600/30'
                      : 'border-[#2a2a4a] bg-[#0d0d1a] hover:border-iara-700/40'
                  }`}
                >
                  <p className={`text-sm font-semibold ${ativo ? 'text-white' : 'text-[#c1c1d8]'}`}>{p.label}</p>
                  <p className="text-[10px] text-[#6b6b8a] mt-0.5">{p.desc}</p>
                </button>
              )
            })}
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="text-xs text-[#9b9bb5] hover:text-white px-3 min-h-12">← Voltar</button>
            <button
              onClick={() => periodos.length > 0 ? setStep(3) : setErro('Marque ao menos 1 período')}
              className="flex items-center gap-2 px-5 min-h-12 rounded-xl bg-gradient-to-r from-iara-500 to-accent-purple text-white text-sm font-bold active:scale-95 transition shadow-lg"
            >
              Próximo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* PASSO 3: Minutos + Compromissos */}
      {step === 3 && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {MINUTOS.map(m => {
              const ativo = minutos === m.val
              return (
                <button
                  key={m.val}
                  onClick={() => setMinutos(m.val)}
                  className={`p-3 rounded-xl border text-left transition-all active:scale-95 ${
                    ativo
                      ? 'border-iara-500 bg-iara-600/30'
                      : 'border-[#2a2a4a] bg-[#0d0d1a] hover:border-iara-700/40'
                  }`}
                >
                  <p className={`text-base font-bold ${ativo ? 'text-white' : 'text-[#c1c1d8]'}`}>{m.label}</p>
                  <p className="text-[10px] text-[#6b6b8a] mt-0.5">{m.desc}</p>
                </button>
              )
            })}
          </div>

          <div className="mb-5">
            <label className="block text-xs text-iara-200/70 mb-1.5">
              Compromissos fixos? <span className="text-[#5a5a7a]">(opcional)</span>
            </label>
            <textarea
              value={compromissos}
              onChange={e => setCompromissos(e.target.value)}
              placeholder="Ex: consultas terça e quinta de tarde · academia 7h · reunião sexta 14h"
              rows={2}
              className="w-full bg-[#0a0a14] border border-[#2a2a4a] rounded-xl p-3 text-sm text-white placeholder:text-[#5a5a7a] focus:outline-none focus:border-iara-500"
            />
          </div>

          {erro && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 text-xs mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {erro}
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="text-xs text-[#9b9bb5] hover:text-white px-3 min-h-12">← Voltar</button>
            <button
              onClick={salvar}
              disabled={salvando || !minutos}
              className="flex items-center gap-2 px-5 min-h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-iara-500 text-white text-sm font-bold active:scale-95 disabled:opacity-50 transition shadow-lg"
            >
              {salvando ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando…</> : <><Check className="w-4 h-4" /> Confirmar e gerar cronograma</>}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
