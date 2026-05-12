'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Mic, MicOff, Sparkles, Loader2, RotateCcw,
  Trophy, ChevronRight, AlertCircle, Dumbbell,
  Cloud,
} from 'lucide-react'
import { toast } from '@/lib/toast'

type Estado = 'idle' | 'recording' | 'transcribing' | 'analyzing' | 'resultado'
type Modo = 'web-speech' | 'whisper'

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

// Detecta o melhor mime-type de áudio suportado pelo MediaRecorder neste browser
function detectarMimeAudio(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm'
  const candidatos = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg']
  for (const c of candidatos) {
    if (MediaRecorder.isTypeSupported(c)) return c
  }
  return 'audio/webm'
}

export default function OratorioPage() {
  const [estado, setEstado] = useState<Estado>('idle')
  const [modo, setModo] = useState<Modo>('web-speech')
  const [transcript, setTranscript] = useState('')
  const [duration, setDuration] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pulseIdx, setPulseIdx] = useState(0)

  // Refs Web Speech
  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef('')

  // Refs MediaRecorder (Whisper fallback)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Comum
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  // Detecta capacidade de Web Speech ao montar
  useEffect(() => {
    if (typeof window === 'undefined') return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    // iOS Safari/PWA reporta SR mas não funciona bem — usa Whisper como padrão
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !/Mac/.test(navigator.platform)
    const isStandalone = typeof window !== 'undefined' &&
      ((window.matchMedia?.('(display-mode: standalone)').matches) ||
       ((window.navigator as Navigator & { standalone?: boolean }).standalone === true))
    if (!SR || isIos || isStandalone) {
      setModo('whisper')
    }
  }, [])

  // Animação das barras enquanto grava
  useEffect(() => {
    if (estado !== 'recording') return
    const interval = setInterval(() => setPulseIdx((p) => (p + 1) % 5), 120)
    return () => clearInterval(interval)
  }, [estado])

  // Cleanup ao desmontar (libera microfone)
  useEffect(() => {
    return () => {
      audioStreamRef.current?.getTracks().forEach(t => t.stop())
      recognitionRef.current?.abort?.()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // ─── INICIAR GRAVAÇÃO ────────────────────────────────────────────
  async function startRecording() {
    setError(null)
    setTranscript('')
    setDuration(0)
    setWordCount(0)
    transcriptRef.current = ''
    audioChunksRef.current = []

    if (modo === 'web-speech') {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SR) {
        // Fallback automático
        setModo('whisper')
        return startWhisperRecording()
      }
      try {
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

        recognition.onerror = (e: any) => {
          // 'no-speech' acontece em silêncio normal — não é erro real, ignora
          if (e.error === 'no-speech' || e.error === 'aborted') return
          // Outros erros: cai pro fallback Whisper
          console.warn('[oratorio] Web Speech error, fallback Whisper:', e.error)
          recognitionRef.current?.abort?.()
          setModo('whisper')
          setError(null)
          // Reinicia em modo Whisper — preserva intenção do user
          startWhisperRecording()
        }

        recognition.start()
        recognitionRef.current = recognition
        startTimeRef.current = Date.now()
        setEstado('recording')

        timerRef.current = setInterval(() => {
          setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
        }, 500)
      } catch (e) {
        console.warn('[oratorio] Web Speech start falhou, fallback:', e)
        setModo('whisper')
        return startWhisperRecording()
      }
      return
    }

    // MODO WHISPER
    return startWhisperRecording()
  }

  const startWhisperRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })
      audioStreamRef.current = stream

      const mimeType = detectarMimeAudio()
      const mr = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mr

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mr.start(1000)  // chunks de 1s
      startTimeRef.current = Date.now()
      setEstado('recording')

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 500)
    } catch (e) {
      const err = e as Error
      let msg = 'Não foi possível acessar o microfone.'
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Permita acesso ao microfone no seu navegador (clique no ícone do cadeado na barra de endereço).'
      } else if (err.name === 'NotFoundError') {
        msg = 'Nenhum microfone foi detectado no seu dispositivo.'
      }
      setError(msg)
      setEstado('idle')
    }
  }, [])

  // ─── PARAR GRAVAÇÃO ────────────────────────────────────────────
  function stopRecording() {
    if (modo === 'web-speech') {
      recognitionRef.current?.stop()
    } else {
      mediaRecorderRef.current?.stop()
      audioStreamRef.current?.getTracks().forEach(t => t.stop())
    }
    if (timerRef.current) clearInterval(timerRef.current)
    setEstado('idle')
  }

  // ─── ANALISAR ────────────────────────────────────────────────────
  async function analyze() {
    if (modo === 'whisper') {
      // Para gravação primeiro, depois transcreve
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        setError('Nada gravado. Clique no microfone primeiro.')
        return
      }

      const dur = Math.floor((Date.now() - startTimeRef.current) / 1000)
      if (dur < 5) {
        setError('Fale por pelo menos 5 segundos antes de analisar.')
        return
      }

      setDuration(dur)
      setEstado('transcribing')
      setError(null)

      // Para o recorder e espera o último chunk
      await new Promise<void>((resolve) => {
        const mr = mediaRecorderRef.current!
        const handler = () => { mr.removeEventListener('stop', handler); resolve() }
        mr.addEventListener('stop', handler)
        mr.stop()
      })
      audioStreamRef.current?.getTracks().forEach(t => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)

      // Combina chunks num blob único
      const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm'
      const blob = new Blob(audioChunksRef.current, { type: mimeType })

      try {
        // Whisper: áudio → texto
        const fd = new FormData()
        fd.append('audio', blob)
        fd.append('duracao_segundos', String(dur))
        const tRes = await fetch('/api/oratorio/transcrever', { method: 'POST', body: fd })

        // Trata Vercel timeout / HTML de erro antes de tentar .json()
        const ct = tRes.headers.get('content-type') ?? ''
        if (!ct.includes('application/json')) {
          if (tRes.status === 504 || tRes.status === 408) {
            throw new Error('A transcrição demorou demais. Tenta uma gravação mais curta.')
          }
          if (tRes.status >= 500) {
            throw new Error(`Servidor com problema (HTTP ${tRes.status}). Tenta de novo em 1min.`)
          }
          throw new Error(`Erro inesperado (HTTP ${tRes.status}).`)
        }

        const tData = await tRes.json()
        if (!tRes.ok) {
          console.error('[oratorio/transcrever] erro da API:', tData)
          throw new Error(tData.error ?? 'Falha ao transcrever áudio')
        }
        const text = (tData.transcript ?? '').trim()
        if (text.split(/\s+/).filter(Boolean).length < 10) {
          throw new Error('Áudio captado é muito curto. Tente falar mais (mínimo 10 palavras).')
        }
        transcriptRef.current = text
        setTranscript(text)
        setWordCount(text.split(/\s+/).filter(Boolean).length)
        // Cai pra análise IA padrão
        await callAnaliseAPI(text, dur, text.split(/\s+/).filter(Boolean).length)
      } catch (err) {
        console.error('[oratorio] transcrição/análise falhou:', err)
        setError(err instanceof Error ? err.message : 'Erro inesperado')
        setEstado('idle')
      }
      return
    }

    // MODO WEB SPEECH (texto já tá em transcriptRef)
    const text = transcriptRef.current
    if (!text || text.split(/\s+/).filter(Boolean).length < 10) {
      setError('Fale mais um pouco antes de analisar — pelo menos 10 palavras.')
      return
    }

    recognitionRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)

    const dur = Math.floor((Date.now() - startTimeRef.current) / 1000)
    setDuration(dur)
    setEstado('analyzing')
    setError(null)

    await callAnaliseAPI(text, dur, text.split(/\s+/).filter(Boolean).length)
  }

  async function callAnaliseAPI(text: string, dur: number, wc: number) {
    setEstado('analyzing')
    try {
      // Timeout client-side de 75s — Vercel mata em 60s, com folga pra
      // capturar e dar mensagem clara em vez de pendurar pra sempre.
      const ctrl = new AbortController()
      const timeoutId = setTimeout(() => ctrl.abort(), 75_000)

      let res: Response
      try {
        res = await fetch('/api/oratorio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: text,
            duracao_segundos: dur,
            word_count: wc,
          }),
          signal: ctrl.signal,
        })
      } finally {
        clearTimeout(timeoutId)
      }

      // Se Vercel deu timeout ou crash, response NÃO é JSON. Sem isso,
      // res.json() joga "Unexpected token < in JSON at position 0" críptico.
      const contentType = res.headers.get('content-type') ?? ''
      const isJson = contentType.includes('application/json')

      if (!res.ok) {
        if (!isJson) {
          // 504 Gateway Timeout / 502 / página HTML de erro
          if (res.status === 504 || res.status === 408) {
            throw new Error('A análise demorou demais (>60s). Tenta com uma gravação mais curta — ou tenta de novo em 1min.')
          }
          if (res.status >= 500) {
            throw new Error(`Servidor com problema (HTTP ${res.status}). Tenta de novo em 1min.`)
          }
          throw new Error(`Erro inesperado do servidor (HTTP ${res.status}).`)
        }
        const data = await res.json().catch(() => ({}))
        const baseMsg = data.mensagem ?? data.error ?? `Erro ao analisar (HTTP ${res.status})`
        console.error('[oratorio] erro da API:', data)
        throw new Error(data.detalhe ? `${baseMsg} — ${data.detalhe}` : baseMsg)
      }

      const data = await res.json()
      const a = data.analysis
      setResultado({
        scores: a.score_confianca !== undefined ? {
          confianca: a.score_confianca,
          energia:   a.score_energia,
          fluidez:   a.score_fluidez,
          emocao:    a.score_emocao,
          clareza:   a.score_clareza,
        } : a.scores,
        score_total:    a.score_total,
        perfil_voz:     a.perfil_voz,
        feedback:       a.feedback,
        exercicios:     a.exercicios ?? [],
        ponto_forte:    data.ponto_forte ?? '',
        ponto_melhorar: data.ponto_melhorar ?? '',
        pontos_ganhos:  data.pontos_ganhos,
        pontos_total:   data.pontos_total,
      })
      setEstado('resultado')
    } catch (err) {
      console.error('[oratorio] análise falhou:', err)
      const msg = err instanceof Error
        ? (err.name === 'AbortError'
            ? 'A análise demorou demais (>75s). Tenta com uma gravação mais curta.'
            : err.message)
        : 'Erro inesperado ao analisar'
      setError(msg)
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
    audioChunksRef.current = []
    audioStreamRef.current?.getTracks().forEach(t => t.stop())
  }

  function alternarModo() {
    if (estado === 'recording') return
    const novo: Modo = modo === 'web-speech' ? 'whisper' : 'web-speech'
    setModo(novo)
    setError(null)
    toast.success(novo === 'whisper'
      ? 'Modo Whisper ativado — funciona em qualquer navegador'
      : 'Modo tempo real ativado (apenas Chrome/Edge)')
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-iara-400 text-sm font-medium">
            <Mic className="w-4 h-4" />
            <span>Módulo</span>
          </div>
          <button
            onClick={alternarModo}
            disabled={estado === 'recording' || estado === 'transcribing' || estado === 'analyzing'}
            className="flex items-center gap-1.5 px-3 min-h-9 rounded-lg border border-[#1a1a2e] text-xs text-[#9b9bb5] hover:border-iara-700/40 hover:text-iara-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Trocar entre tempo real (Chrome/Edge) e Whisper (qualquer navegador)"
          >
            {modo === 'whisper'
              ? <><Cloud className="w-3 h-3" /> Modo Whisper</>
              : <><Mic className="w-3 h-3" /> Modo tempo real</>
            }
          </button>
        </div>
        <h1 className="text-3xl font-bold text-[#f1f1f8]">
          Análise de <span className="iara-gradient-text">Oratória</span>
        </h1>
        <p className="mt-2 text-[#9b9bb5]">
          Grave sua voz, receba um score em 5 dimensões e exercícios para evoluir.
          Sua voz vira parte do seu perfil e personaliza todos os módulos de IA.
        </p>
      </div>

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
                aria-label={estado === 'recording' ? 'Gravando' : 'Iniciar gravação'}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                  estado === 'recording'
                    ? 'bg-red-600 shadow-red-900/50 cursor-default'
                    : 'bg-gradient-to-br from-iara-600 to-accent-purple hover:scale-105 shadow-iara-900/50 cursor-pointer'
                }`}
              >
                <Mic className="w-10 h-10 text-white" />
              </button>
            </div>

            {/* Timer */}
            {estado === 'recording' && (
              <div className="mb-4">
                <span className="text-3xl font-mono font-bold text-red-400">{formatTimer(duration)}</span>
                {modo === 'web-speech' && (
                  <p className="text-xs text-[#5a5a7a] mt-1">{wordCount} palavras captadas</p>
                )}
                {modo === 'whisper' && (
                  <p className="text-xs text-[#5a5a7a] mt-1 flex items-center justify-center gap-1">
                    <Cloud className="w-3 h-3" /> Gravando — transcrição acontece ao parar
                  </p>
                )}
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

            {/* Transcript em tempo real (apenas Web Speech) */}
            {estado === 'recording' && modo === 'web-speech' && transcript && (
              <div className="w-full max-w-lg mb-5 px-4 py-3 rounded-xl bg-[#0f0f1e] border border-iara-900/30 text-left">
                <p className="text-xs text-[#5a5a7a] mb-1 uppercase tracking-wider font-medium">Transcrição em tempo real</p>
                <p className="text-sm text-[#d0d0e8] leading-relaxed">{transcript}</p>
              </div>
            )}

            {estado === 'idle' && (
              <>
                <p className="text-[#9b9bb5] text-sm mb-1">Clique no microfone e comece a falar</p>
                <p className="text-[#5a5a7a] text-xs mb-2">
                  Fale sobre seu nicho, apresente um produto, conte uma história — mínimo 30 segundos
                </p>
                <p className="text-[10px] text-[#4a4a6a] mb-6">
                  Modo atual: <strong className="text-iara-400">{modo === 'whisper' ? 'Whisper (qualquer navegador)' : 'Tempo real (Chrome/Edge)'}</strong>
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
              <div className="flex items-start gap-2 mt-4 px-4 py-3 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-sm max-w-md">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {error}
                  {error.includes('Faça upgrade') && (
                    <a href="/#planos" className="ml-1 underline text-red-300 hover:text-red-200 transition-colors">Ver planos →</a>
                  )}
                </span>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              {estado === 'recording' && (
                <>
                  <button
                    onClick={stopRecording}
                    className="iara-btn-secondary px-5 min-h-11"
                  >
                    <MicOff className="w-4 h-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={analyze}
                    disabled={modo === 'web-speech' ? wordCount < 10 : duration < 5}
                    className="iara-btn-primary px-6 min-h-11"
                  >
                    <Sparkles className="w-4 h-4" />
                    {modo === 'whisper' ? 'Parar e analisar' : 'Analisar agora'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TRANSCRIBING (Whisper) */}
      {estado === 'transcribing' && (
        <div className="iara-card p-12 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center animate-pulse-slow">
            <Cloud className="w-7 h-7 text-white" />
          </div>
          <p className="text-[#f1f1f8] font-semibold">Transcrevendo seu áudio...</p>
          <p className="text-sm text-[#5a5a7a]">Whisper está convertendo voz em texto</p>
          <Loader2 className="w-5 h-5 text-iara-400 animate-spin mt-2" />
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
                <p className="text-sm font-semibold text-[#f1f1f8]">Exercícios pra evoluir</p>
              </div>
              <div className="space-y-2">
                {resultado.exercicios.map((ex, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-iara-900/20 border border-iara-900/30">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-iara-600/40 border border-iara-700/40 flex items-center justify-center text-[10px] font-bold text-iara-300">{i + 1}</span>
                    <p className="text-sm text-[#d0d0e8] leading-relaxed">{ex}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA: nova gravação */}
          <div className="flex justify-center">
            <button onClick={reset} className="iara-btn-secondary px-6 min-h-11">
              <RotateCcw className="w-4 h-4" />
              Gravar de novo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
