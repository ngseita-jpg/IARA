'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

import { useState, useRef, useEffect } from 'react'
import {
  Mic, MicOff, Sparkles, Loader2, RotateCcw,
  Trophy, ChevronRight, AlertCircle, Dumbbell,
} from 'lucide-react'

type Estado = 'idle' | 'recording' | 'analyzing' | 'resultado'

type Scores = {
  confianca: number
  energia: number
  fluidez: number
  emocao: number
  clareza: number
}

type Resultado = {
  scores: Scores
  score_total: number
  perfil_voz: string
  feedback: string
  exercicios: string[]
  ponto_forte: string
  ponto_melhorar: string
  pontos_ganhos: number
  pontos_total: number
}

const DIMENSOES: { key: keyof Scores; label: string; desc: string }[] = [
  { key: 'confianca', label: 'Confiança',  desc: 'Assertividade e segurança no discurso' },
  { key: 'fluidez',   label: 'Fluidez',    desc: 'Organização e ausência de repetições' },
  { key: 'clareza',   label: 'Clareza',    desc: 'Objetividade e fácil compreensão' },
  { key: 'emocao',    label: 'Emoção',     desc: 'Expressividade e conexão humana' },
  { key: 'energia',   label: 'Energia',    desc: 'Dinamismo e entusiasmo na fala' },
]

function scoreColor(s: number) {
  if (s >= 75) return 'bg-green-500'
  if (s >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

function scoreTextColor(s: number) {
  if (s >= 75) return 'text-green-400'
  if (s >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

function formatTimer(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function OratorioPage() {
  const [estado, setEstado] = useState<Estado>('idle')
  const [transcript, setTranscript] = useState('')
  const [duration, setDuration] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState(true)
  const [pulseIdx, setPulseIdx] = useState(0)

  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const transcriptRef = useRef('')

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) setSupported(false)
  }, [])

  // Animação das barras enquanto grava
  useEffect(() => {
    if (estado !== 'recording') return
    const interval = setInterval(() => setPulseIdx((p) => (p + 1) % 5), 120)
    return () => clearInterval(interval)
  }, [estado])

  function startRecording() {
    setError(null)
    setTranscript('')
    setDuration(0)
    setWordCount(0)
    transcriptRef.current = ''

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SR) {
      setError('Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.')
      return
    }

    const recognition = new SR()
    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let final = ''
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' '
        }
      }
      transcriptRef.current = final.trim()
      setTranscript(final.trim())
      setWordCount(final.trim().split(/\s+/).filter(Boolean).length)
    }

    recognition.onerror = () => {
      setError('Erro no microfone. Verifique as permissões e tente novamente.')
      stopRecording()
    }

    recognition.start()
    recognitionRef.current = recognition
    startTimeRef.current = Date.now()
    setEstado('recording')

    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 500)
  }

  function stopRecording() {
    recognitionRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    setEstado('idle')
  }

  async function analyze() {
    const text = transcriptRef.current
    if (!text || text.split(/\s+/).length < 10) {
      setError('Fale mais um pouco antes de analisar — pelo menos 10 palavras.')
      return
    }

    recognitionRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)

    const dur = Math.floor((Date.now() - startTimeRef.current) / 1000)
    setDuration(dur)
    setEstado('analyzing')
    setError(null)

    try {
      const res = await fetch('/api/oratorio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          duracao_segundos: dur,
          word_count: text.split(/\s+/).filter(Boolean).length,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.mensagem ?? data.error ?? 'Erro ao analisar')

      setResultado({
        scores: data.analysis.score_confianca !== undefined ? {
          confianca: data.analysis.score_confianca,
          energia:   data.analysis.score_energia,
          fluidez:   data.analysis.score_fluidez,
          emocao:    data.analysis.score_emocao,
          clareza:   data.analysis.score_clareza,
        } : data.analysis.scores,
        score_total:   data.analysis.score_total,
        perfil_voz:    data.analysis.perfil_voz,
        feedback:      data.analysis.feedback,
        exercicios:    data.analysis.exercicios ?? [],
        ponto_forte:   data.analysis.ponto_forte ?? '',
        ponto_melhorar: data.analysis.ponto_melhorar ?? '',
        pontos_ganhos: data.pontos_ganhos,
        pontos_total:  data.pontos_total,
      })
      setEstado('resultado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
      setEstado('idle')
    }
  }

  function reset() {
    setEstado('idle')
    setTranscript('')
    setDuration(0)
    setWordCount(0)
    setResultado(null)
    setError(null)
    transcriptRef.current = ''
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-iara-400 text-sm font-medium mb-2">
          <Mic className="w-4 h-4" />
          <span>Módulo</span>
        </div>
        <h1 className="text-3xl font-bold text-[#f1f1f8]">
          Análise de <span className="iara-gradient-text">Oratória</span>
        </h1>
        <p className="mt-2 text-[#9b9bb5]">
          Grave sua voz, receba um score em 5 dimensões e exercícios para evoluir.
          Sua voz vira parte do seu perfil e personaliza todos os módulos de IA.
        </p>
      </div>

      {!supported && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-900/20 border border-yellow-800/40 text-yellow-400 text-sm mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Reconhecimento de voz não disponível. Use Chrome, Edge ou Brave.
        </div>
      )}

      {/* IDLE / RECORDING */}
      {(estado === 'idle' || estado === 'recording') && (
        <div className="iara-card p-8">
          <div className="flex flex-col items-center text-center">

            {/* Mic button */}
            <div className="relative mb-6">
              {estado === 'recording' && (
                <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
              )}
              <button
                onClick={estado === 'recording' ? undefined : startRecording}
                disabled={!supported}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                  estado === 'recording'
                    ? 'bg-red-600 shadow-red-900/50 cursor-default'
                    : 'bg-gradient-to-br from-iara-600 to-accent-purple hover:scale-105 shadow-iara-900/50 cursor-pointer'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <Mic className="w-10 h-10 text-white" />
              </button>
            </div>

            {/* Timer */}
            {estado === 'recording' && (
              <div className="mb-4">
                <span className="text-3xl font-mono font-bold text-red-400">{formatTimer(duration)}</span>
                <p className="text-xs text-[#5a5a7a] mt-1">{wordCount} palavras captadas</p>
              </div>
            )}

            {/* Waveform animation */}
            {estado === 'recording' && (
              <div className="flex items-end gap-1 h-10 mb-5">
                {[3, 5, 8, 6, 4, 7, 9, 5, 3, 6, 8, 4, 7, 5, 3].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-red-500 transition-all duration-100"
                    style={{
                      height: `${pulseIdx === i % 5 ? h * 4 : h * 2}px`,
                      opacity: pulseIdx === i % 5 ? 1 : 0.4,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Transcript em tempo real */}
            {estado === 'recording' && transcript && (
              <div className="w-full max-w-lg mb-5 px-4 py-3 rounded-xl bg-[#0f0f1e] border border-iara-900/30 text-left">
                <p className="text-xs text-[#5a5a7a] mb-1 uppercase tracking-wider font-medium">Transcrição em tempo real</p>
                <p className="text-sm text-[#d0d0e8] leading-relaxed">{transcript}</p>
              </div>
            )}

            {estado === 'idle' && (
              <>
                <p className="text-[#9b9bb5] text-sm mb-1">Clique no microfone e comece a falar</p>
                <p className="text-[#5a5a7a] text-xs mb-6">
                  Fale sobre seu nicho, apresente um produto, conte uma história — mínimo 30 segundos
                </p>
                <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                  {['Apresente seu canal', 'Fale do seu nicho', 'Pitche um produto'].map((tip) => (
                    <div key={tip} className="px-2 py-2 rounded-lg bg-iara-900/20 border border-iara-900/30 text-xs text-[#5a5a7a] text-center">
                      {tip}
                    </div>
                  ))}
                </div>
              </>
            )}

            {error && (
              <div className="flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  {error}
                  {error.includes('Faça upgrade') && (
                    <a href="/#planos" className="ml-1 underline text-red-300 hover:text-red-200 transition-colors">Ver planos →</a>
                  )}
                </span>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex gap-3 mt-6">
              {estado === 'recording' && (
                <>
                  <button
                    onClick={stopRecording}
                    className="iara-btn-secondary px-5 py-2.5"
                  >
                    <MicOff className="w-4 h-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={analyze}
                    disabled={wordCount < 10}
                    className="iara-btn-primary px-6 py-2.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    Analisar agora
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ANALYZING */}
      {estado === 'analyzing' && (
        <div className="iara-card p-12 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center animate-pulse-slow">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <p className="text-[#f1f1f8] font-semibold">Analisando sua oratória...</p>
          <p className="text-sm text-[#5a5a7a]">A Iara está avaliando confiança, fluidez, clareza, emoção e energia</p>
          <Loader2 className="w-5 h-5 text-iara-400 animate-spin mt-2" />
        </div>
      )}

      {/* RESULTADO */}
      {estado === 'resultado' && resultado && (
        <div className="space-y-5 animate-fade-in">

          {/* Score total + pontos ganhos */}
          <div className="iara-card p-5 sm:p-6">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="flex-shrink-0 text-center">
                <div className={`text-5xl font-black ${scoreTextColor(resultado.score_total)}`}>
                  {resultado.score_total}
                </div>
                <p className="text-xs text-[#5a5a7a] mt-1">Score total</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#f1f1f8] mb-1">{resultado.perfil_voz}</p>
                <p className="text-xs text-[#9b9bb5] leading-relaxed">{resultado.feedback}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 px-3 py-2 rounded-xl bg-iara-900/40 border border-iara-700/30 w-fit">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">+{resultado.pontos_ganhos} pts</span>
              <span className="text-xs text-[#5a5a7a] ml-1">· {resultado.pontos_total} pts total</span>
            </div>
          </div>

          {/* Scores por dimensão */}
          <div className="iara-card p-6">
            <p className="text-sm font-semibold text-[#f1f1f8] mb-4">Resultado por dimensão</p>
            <div className="space-y-3.5">
              {DIMENSOES.map(({ key, label, desc }) => {
                const score = resultado.scores[key]
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-medium text-[#f1f1f8]">{label}</span>
                        <span className="text-xs text-[#5a5a7a] ml-2">{desc}</span>
                      </div>
                      <span className={`text-sm font-bold ${scoreTextColor(score)}`}>{score}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#1a1a2e] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${scoreColor(score)}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pontos fortes e a melhorar */}
          {(resultado.ponto_forte || resultado.ponto_melhorar) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {resultado.ponto_forte && (
                <div className="iara-card p-4 border-green-800/20 bg-green-900/10">
                  <p className="text-xs font-semibold text-green-400 mb-1 uppercase tracking-wider">✓ Ponto forte</p>
                  <p className="text-sm text-[#d0d0e8]">{resultado.ponto_forte}</p>
                </div>
              )}
              {resultado.ponto_melhorar && (
                <div className="iara-card p-4 border-yellow-800/20 bg-yellow-900/10">
                  <p className="text-xs font-semibold text-yellow-400 mb-1 uppercase tracking-wider">↑ Melhorar</p>
                  <p className="text-sm text-[#d0d0e8]">{resultado.ponto_melhorar}</p>
                </div>
              )}
            </div>
          )}

          {/* Exercícios */}
          {resultado.exercicios.length > 0 && (
            <div className="iara-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell className="w-4 h-4 text-iara-400" />
                <p className="text-sm font-semibold text-[#f1f1f8]">Treinos para você evoluir</p>
              </div>
              <div className="space-y-3">
                {resultado.exercicios.map((ex, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-iara-900/20 border border-iara-900/30">
                    <div className="w-6 h-6 rounded-full bg-iara-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-iara-400">{i + 1}</span>
                    </div>
                    <p className="text-sm text-[#d0d0e8] leading-relaxed">{ex}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcrição */}
          <details className="iara-card p-4 cursor-pointer group">
            <summary className="flex items-center justify-between text-sm font-medium text-[#9b9bb5] list-none">
              Ver transcrição completa
              <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="mt-3 text-sm text-[#5a5a7a] leading-relaxed">{transcript}</p>
          </details>

          {/* Botões */}
          <div className="flex gap-3">
            <button onClick={reset} className="iara-btn-secondary flex-1 py-3">
              <RotateCcw className="w-4 h-4" />
              Nova análise
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
