'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronRight, ChevronLeft, Check, Loader2, Sparkles,
  Mic, Trophy, RefreshCw, User, Play, X,
} from 'lucide-react'
import { getBadgeInfo } from '@/lib/badges'
import { getPlatformIcon } from '@/components/platform-icons'

// ─── tipos ────────────────────────────────────────────────────────────────────

type VideoRef = {
  url: string
  titulo: string
  plataforma: string
  thumbnail?: string
  transcricao?: string | null
  aviso?: string
}

type Profile = {
  nome_artistico: string
  nicho: string
  sub_nicho: string
  estagio: string
  historia: string
  audiencia: string
  faixa_etaria: string
  problema_resolvido: string
  publico_real: string
  plataformas: string[]
  formatos: string[]
  frequencia: string
  conteudo_marcante: string
  tom_de_voz: string
  diferencial: string
  inspiracoes: string
  objetivo: string
  desafio_principal: string
  meta_12_meses: string
  proposito: string
  video_referencias: VideoRef[]
  sobre: string
  pontos?: number
  nivel?: number
  treinos_voz?: number
  voz_perfil?: string
  voz_score_medio?: number
}

const EMPTY: Profile = {
  nome_artistico: '', nicho: '', sub_nicho: '', estagio: '',
  historia: '', audiencia: '', faixa_etaria: '', problema_resolvido: '',
  publico_real: '', plataformas: [], formatos: [], frequencia: '',
  conteudo_marcante: '', tom_de_voz: '', diferencial: '', inspiracoes: '',
  objetivo: '', desafio_principal: '', meta_12_meses: '',
  proposito: '', video_referencias: [], sobre: '',
}

// ─── dados de configuração ────────────────────────────────────────────────────

const NICHOS = [
  { value: 'Fitness e Saúde',               icon: '💪' },
  { value: 'Finanças e Investimentos',       icon: '💰' },
  { value: 'Lifestyle',                      icon: '✨' },
  { value: 'Beleza e Moda',                  icon: '💄' },
  { value: 'Gastronomia',                    icon: '🍽️' },
  { value: 'Tecnologia',                     icon: '💻' },
  { value: 'Educação',                       icon: '📚' },
  { value: 'Entretenimento',                 icon: '🎭' },
  { value: 'Esportes',                       icon: '⚽' },
  { value: 'Games',                          icon: '🎮' },
  { value: 'Viagem',                         icon: '✈️' },
  { value: 'Negócios e Empreendedorismo',    icon: '🚀' },
  { value: 'Humor e Comédia',                icon: '😂' },
  { value: 'Música',                         icon: '🎵' },
  { value: 'Arte e Design',                  icon: '🎨' },
  { value: 'Outro',                          icon: '🌟' },
]

const ESTAGIOS = [
  { value: 'Começando',    desc: 'Menos de 1 mil seguidores',   emoji: '🌱' },
  { value: 'Crescendo',    desc: '1 mil a 50 mil seguidores',   emoji: '🌿' },
  { value: 'Estabelecido', desc: '50 mil a 500 mil seguidores', emoji: '🌳' },
  { value: 'Grande',       desc: 'Mais de 500 mil seguidores',  emoji: '🌲' },
]

const PLATAFORMAS_OPTS = [
  { value: 'Instagram' },
  { value: 'YouTube' },
  { value: 'TikTok' },
  { value: 'LinkedIn' },
  { value: 'Twitter/X', icon: '𝕏' },
  { value: 'Kwai',      icon: '🎬' },
  { value: 'Pinterest', icon: '📌' },
  { value: 'Podcast',   icon: '🎙️' },
]

const FORMATOS_OPTS = [
  'Reels / Shorts', 'Carrossel', 'Vídeo longo', 'Stories', 'Live', 'Podcast', 'Thread / Post', 'Newsletter',
]

const FREQUENCIAS = [
  { value: 'Diário',           desc: '7x por semana ou mais' },
  { value: '3-4x por semana',  desc: 'Ritmo consistente' },
  { value: '1-2x por semana',  desc: 'Cadência regular' },
  { value: 'Semanal',          desc: 'Uma vez por semana' },
  { value: 'Irregular',        desc: 'Sem frequência fixa' },
]

const FAIXAS_ETARIAS = ['13-17 anos', '18-24 anos', '25-34 anos', '35-44 anos', '45+ anos', 'Público misto']

const TOM_TAGS = [
  'Descontraído', 'Formal', 'Usa humor', 'Sério', 'Storytelling',
  'Direto ao ponto', 'Educativo', 'Inspiracional', 'Polêmico', 'Emocional',
  'Prático', 'Usa gírias', 'Fala rápido', 'Pausado e reflexivo',
]

const OBJETIVOS_OPTS = [
  { value: 'Crescer minha audiência',          emoji: '📈' },
  { value: 'Monetizar meu conteúdo',           emoji: '💸' },
  { value: 'Construir autoridade no meu nicho', emoji: '🏆' },
  { value: 'Fechar parcerias com marcas',       emoji: '🤝' },
  { value: 'Educar minha audiência',            emoji: '🎓' },
  { value: 'Me divertir e criar',               emoji: '🎉' },
]

const DESAFIOS_OPTS = [
  'Consistência', 'Crescimento', 'Monetização', 'Engajamento',
  'Ideias de conteúdo', 'Algoritmo', 'Falta de tempo', 'Edição e produção',
]

// ─── steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 'identidade', titulo: 'Quem é você?',          subtitulo: 'Vamos começar pelo básico da sua identidade como criador.' },
  { id: 'audiencia',  titulo: 'Para quem você cria?',   subtitulo: 'Entender seu público é a chave para conteúdo que gera resultado.' },
  { id: 'criacao',    titulo: 'Como você cria?',        subtitulo: 'Sua rotina e formato dizem muito sobre como a IA deve te ajudar.' },
  { id: 'estilo',     titulo: 'Seu jeito de ser',       subtitulo: 'O que te torna único. Isso vai entrar em cada roteiro e sugestão.' },
  { id: 'objetivos',  titulo: 'Onde você quer chegar?', subtitulo: 'Seus objetivos moldam as recomendações estratégicas da Iara.' },
]

// ─── componentes auxiliares ───────────────────────────────────────────────────

function StepDot({ index, current, completed }: { index: number; current: number; completed: boolean }) {
  const isActive = index === current
  const isDone = completed || index < current
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
      isActive  ? 'bg-gradient-to-br from-iara-600 to-accent-purple text-white shadow-lg shadow-iara-900/50 scale-110' :
      isDone    ? 'bg-green-500/20 border border-green-500/40 text-green-400' :
                  'bg-[#1a1a2e] border border-[#2a2a4e] text-[#5a5a7a]'
    }`}>
      {isDone && !isActive ? <Check className="w-3.5 h-3.5" /> : index + 1}
    </div>
  )
}

function ChipToggle({
  value, selected, onClick, children,
}: { value: string; selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
        selected
          ? 'bg-iara-600/20 border-iara-600/40 text-iara-300'
          : 'bg-[#0f0f1e] border-[#1a1a2e] text-[#5a5a7a] hover:border-iara-700/40 hover:text-[#9b9bb5]'
      }`}
    >
      {children}
    </button>
  )
}

// ─── página principal ─────────────────────────────────────────────────────────

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [gerandoPersona, setGerandoPersona] = useState(false)
  const [personaGerada, setPersonaGerada] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [analisandoVideo, setAnalisandoVideo] = useState(false)

  function set(field: keyof Profile, value: unknown) {
    setProfile((p) => ({ ...p, [field]: value }))
  }

  function toggleArr(field: 'plataformas' | 'formatos', value: string) {
    setProfile((p) => ({
      ...p,
      [field]: (p[field] as string[]).includes(value)
        ? (p[field] as string[]).filter((v) => v !== value)
        : [...(p[field] as string[]), value],
    }))
  }

  function toggleNicho(value: string) {
    const tags = profile.nicho ? profile.nicho.split(', ').filter(Boolean) : []
    const updated = tags.includes(value) ? tags.filter((t) => t !== value) : [...tags, value]
    set('nicho', updated.join(', '))
  }

  function nichoTags() {
    return profile.nicho ? profile.nicho.split(', ').filter(Boolean) : []
  }

  function toggleTom(tag: string) {
    const tags = profile.tom_de_voz ? profile.tom_de_voz.split(', ').filter(Boolean) : []
    const updated = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]
    set('tom_de_voz', updated.join(', '))
  }

  function tomTags() {
    return profile.tom_de_voz ? profile.tom_de_voz.split(', ').filter(Boolean) : []
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    fetch('/api/perfil')
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setProfile({
            nome_artistico:     data.nome_artistico     ?? '',
            nicho:              data.nicho              ?? '',
            sub_nicho:          data.sub_nicho          ?? '',
            estagio:            data.estagio            ?? '',
            historia:           data.historia           ?? '',
            audiencia:          data.audiencia          ?? '',
            faixa_etaria:       data.faixa_etaria       ?? '',
            problema_resolvido: data.problema_resolvido ?? '',
            publico_real:       data.publico_real       ?? '',
            plataformas:        data.plataformas        ?? [],
            formatos:           data.formatos           ?? [],
            frequencia:         data.frequencia         ?? '',
            conteudo_marcante:  data.conteudo_marcante  ?? '',
            tom_de_voz:         data.tom_de_voz         ?? '',
            diferencial:        data.diferencial        ?? '',
            inspiracoes:        data.inspiracoes        ?? '',
            objetivo:           data.objetivo           ?? '',
            desafio_principal:  data.desafio_principal  ?? '',
            meta_12_meses:      data.meta_12_meses      ?? '',
            proposito:          data.proposito          ?? '',
            video_referencias:  data.video_referencias  ?? [],
            sobre:              data.sobre              ?? '',
            pontos:             data.pontos             ?? 0,
            nivel:              data.nivel              ?? 0,
            treinos_voz:        data.treinos_voz        ?? 0,
            voz_perfil:         data.voz_perfil         ?? '',
            voz_score_medio:    data.voz_score_medio,
          })
          if (data.sobre) setPersonaGerada(true)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function saveProfile() {
    setSaving(true)
    await fetch('/api/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    setSaving(false)
  }

  async function handleNext() {
    await saveProfile()
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
    }
  }

  async function handleGerarPersona() {
    await saveProfile()
    setGerandoPersona(true)
    const res = await fetch('/api/perfil/gerar-persona', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    if (res.ok) {
      const d = await res.json()
      set('sobre', d.persona)
      setPersonaGerada(true)
      showToast('Persona gerada com sucesso!')
    }
    setGerandoPersona(false)
  }

  async function handleAdicionarVideo() {
    if (!videoUrl.trim()) return
    setAnalisandoVideo(true)
    const res = await fetch('/api/video/analisar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: videoUrl.trim() }),
    })
    if (res.ok) {
      const video: VideoRef = await res.json()
      const novasRefs = [...profile.video_referencias, video]
      set('video_referencias', novasRefs)
      await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, video_referencias: novasRefs }),
      })
      setVideoUrl('')
      showToast(video.aviso ?? `"${video.titulo}" adicionado!`)
    } else {
      showToast('Não foi possível analisar esse link')
    }
    setAnalisandoVideo(false)
  }

  function handleRemoverVideo(url: string) {
    const novasRefs = profile.video_referencias.filter((v) => v.url !== url)
    set('video_referencias', novasRefs)
    fetch('/api/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, video_referencias: novasRefs }),
    })
  }

  const badge = getBadgeInfo(profile.pontos ?? 0, profile.nicho || undefined)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 text-iara-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-w-2xl">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl bg-iara-900/90 border border-iara-700/40 text-iara-200 text-sm font-medium shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-iara-400 text-sm font-medium mb-2">
          <User className="w-4 h-4" />
          <span>Sua Persona</span>
        </div>
        <h1 className="text-3xl font-bold text-[#f1f1f8]">
          Conheça a <span className="iara-gradient-text">Iara</span>
        </h1>
        <p className="mt-1 text-[#9b9bb5] text-sm">
          Quanto mais você conta sobre si, mais a IA fala como seu assessor pessoal — não como um robô.
        </p>
      </div>

      {/* Badge + stats */}
      <div className="iara-card p-4 mb-6 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${badge.cor.bg} border ${badge.cor.border} flex items-center justify-center text-2xl flex-shrink-0`}>
          {badge.cor.emoji}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className={`font-bold ${badge.cor.text}`}>{badge.badge}</p>
            <span className="text-xs text-[#5a5a7a]">· {badge.pontos} pts</span>
          </div>
          {badge.nextThreshold && (
            <>
              <div className="h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden mb-1">
                <div className={`h-full rounded-full ${badge.cor.bg.replace('/30', '/60')}`} style={{ width: `${badge.progress}%` }} />
              </div>
              <p className="text-[10px] text-[#5a5a7a]">{badge.pontosParaProximo} pts para {badge.proximoBadge}</p>
            </>
          )}
        </div>
        <div className="text-right text-xs text-[#5a5a7a]">
          <p>{profile.treinos_voz ?? 0} treinos de voz</p>
          {profile.voz_score_medio && <p className="text-iara-400 font-medium">Score: {profile.voz_score_medio}/100</p>}
        </div>
      </div>

      {/* Perfil de voz */}
      {profile.voz_perfil ? (
        <div className="iara-card p-4 mb-6 flex items-start gap-3 border-accent-purple/20">
          <div className="w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
            <Mic className="w-4 h-4 text-accent-purple" />
          </div>
          <div>
            <p className="text-xs font-semibold text-accent-purple mb-1 uppercase tracking-wider">Perfil vocal (gerado pela IA)</p>
            <p className="text-sm text-[#d0d0e8]">{profile.voz_perfil}</p>
          </div>
        </div>
      ) : (
        <Link href="/dashboard/oratorio" className="iara-card p-4 mb-6 flex items-center gap-3 border-dashed border-[#2a2a4e] hover:border-accent-purple/40 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center flex-shrink-0">
            <Mic className="w-4 h-4 text-[#5a5a7a]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#9b9bb5]">Perfil vocal não configurado</p>
            <p className="text-xs text-[#5a5a7a]">Faça uma análise de oratória e a IA aprende seu estilo →</p>
          </div>
        </Link>
      )}

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button onClick={() => setStep(i)}>
              <StepDot index={i} current={step} completed={false} />
            </button>
            {i < STEPS.length - 1 && (
              <div className={`h-px flex-1 w-6 transition-colors ${i < step ? 'bg-iara-600/60' : 'bg-[#1a1a2e]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="iara-card p-6 mb-6">
        <div className="mb-6">
          <p className="text-xs font-medium text-iara-400 uppercase tracking-wider mb-1">
            Passo {step + 1} de {STEPS.length}
          </p>
          <h2 className="text-xl font-bold text-[#f1f1f8]">{STEPS[step].titulo}</h2>
          <p className="text-sm text-[#9b9bb5] mt-1">{STEPS[step].subtitulo}</p>
        </div>

        {/* ── STEP 1: Identidade ── */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <label className="iara-label">Como te chamam? <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={profile.nome_artistico}
                onChange={(e) => set('nome_artistico', e.target.value)}
                placeholder="Ex: João Vittor, @marketingdaana, Nath Finanças…"
                className="iara-input"
              />
            </div>

            <div>
              <label className="iara-label">Quais são os seus nichos? <span className="text-red-400">*</span> <span className="text-[#3a3a5a] normal-case font-normal">(pode marcar vários)</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {NICHOS.map((n) => (
                  <button
                    key={n.value}
                    type="button"
                    onClick={() => toggleNicho(n.value)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                      nichoTags().includes(n.value)
                        ? 'bg-iara-600/20 border-iara-600/40 text-iara-300'
                        : 'bg-[#0f0f1e] border-[#1a1a2e] text-[#5a5a7a] hover:border-iara-700/40 hover:text-[#9b9bb5]'
                    }`}
                  >
                    <span className="text-xl">{n.icon}</span>
                    <span className="text-center leading-tight">{n.value}</span>
                  </button>
                ))}
              </div>
            </div>

            {profile.nicho && (
              <div>
                <label className="iara-label">Qual é o seu recorte específico dentro desse nicho?</label>
                <input
                  type="text"
                  value={profile.sub_nicho}
                  onChange={(e) => set('sub_nicho', e.target.value)}
                  placeholder={`Ex: "personal trainer para mães acima de 35 anos", "finanças para autônomos"`}
                  className="iara-input"
                />
                <p className="text-xs text-[#5a5a7a] mt-1.5">Quanto mais específico, mais certeira fica a IA.</p>
              </div>
            )}

            {profile.nicho && profile.sub_nicho && (
              <div>
                <label className="iara-label">
                  Conta como você chegou até aqui como criador
                  <span className="text-[#5a5a7a] font-normal"> — o que te motivou a começar?</span>
                </label>
                <textarea
                  value={profile.historia}
                  onChange={(e) => set('historia', e.target.value)}
                  placeholder="Ex: Comecei a postar sobre emagrecimento depois que perdi 18kg e minha família toda queria saber como eu tinha feito. Percebi que tinha muito mito e desinformação circulando e decidi usar minha experiência real para ajudar quem estava no mesmo ponto que eu estava..."
                  rows={4}
                  className="iara-input resize-none"
                />
                <p className="text-xs text-[#5a5a7a] mt-1.5">Sua história é um dos ativos mais valiosos do seu conteúdo. Não precisa ser perfeito — só verdadeiro.</p>
              </div>
            )}

            <div>
              <label className="iara-label">Em que estágio você está hoje?</label>
              <div className="grid grid-cols-2 gap-3">
                {ESTAGIOS.map((e) => (
                  <button
                    key={e.value}
                    type="button"
                    onClick={() => set('estagio', e.value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                      profile.estagio === e.value
                        ? 'bg-iara-600/20 border-iara-600/40'
                        : 'bg-[#0f0f1e] border-[#1a1a2e] hover:border-iara-700/40'
                    }`}
                  >
                    <span className="text-2xl">{e.emoji}</span>
                    <div>
                      <p className={`text-sm font-semibold ${profile.estagio === e.value ? 'text-iara-300' : 'text-[#9b9bb5]'}`}>{e.value}</p>
                      <p className="text-xs text-[#5a5a7a]">{e.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Audiência ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="iara-label">Descreva seu público ideal em uma frase</label>
              <textarea
                value={profile.audiencia}
                onChange={(e) => set('audiencia', e.target.value)}
                placeholder="Ex: Mulheres de 25-40 anos que querem emagrecer sem academia, com rotina corrida e filhos pequenos."
                rows={3}
                className="iara-input resize-none"
              />
            </div>

            <div>
              <label className="iara-label">Qual a faixa etária principal do seu público?</label>
              <div className="flex flex-wrap gap-2">
                {FAIXAS_ETARIAS.map((f) => (
                  <ChipToggle key={f} value={f} selected={profile.faixa_etaria === f} onClick={() => set('faixa_etaria', f)}>
                    {f}
                  </ChipToggle>
                ))}
              </div>
            </div>

            <div>
              <label className="iara-label">Qual dor ou problema você resolve para essa pessoa?</label>
              <textarea
                value={profile.problema_resolvido}
                onChange={(e) => set('problema_resolvido', e.target.value)}
                placeholder="Ex: Falta de tempo e motivação para se exercitar. Não sabe por onde começar e tem medo de se machucar."
                rows={3}
                className="iara-input resize-none"
              />
              <p className="text-xs text-[#5a5a7a] mt-1.5">Isso ajuda a IA a criar conteúdo que realmente ressoa com o seu público.</p>
            </div>

            <div>
              <label className="iara-label">
                O que seu público mais comenta, agradece ou te manda no DM?
                <span className="text-[#5a5a7a] font-normal"> (opcional)</span>
              </label>
              <textarea
                value={profile.publico_real}
                onChange={(e) => set('publico_real', e.target.value)}
                placeholder="Ex: Muito obrigada, você foi a única que explicou sem me fazer sentir culpada. Me identifico demais com você, parece que me leu. Preciso de uma versão mais fácil disso pra aplicar com meus filhos..."
                rows={4}
                className="iara-input resize-none"
              />
              <p className="text-xs text-[#5a5a7a] mt-1.5">As palavras reais do seu público são ouro para a IA entender o tom certo e os temas que mais importam.</p>
            </div>
          </div>
        )}

        {/* ── STEP 3: Criação ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="iara-label">Onde você cria conteúdo?</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PLATAFORMAS_OPTS.map((p) => {
                  const svgIcon = ['Instagram', 'YouTube', 'TikTok', 'LinkedIn'].includes(p.value)
                    ? getPlatformIcon(p.value.toLowerCase(), 20)
                    : null
                  const selected = profile.plataformas.includes(p.value)
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => toggleArr('plataformas', p.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        selected
                          ? 'bg-iara-600/20 border-iara-600/40 text-iara-300'
                          : 'bg-[#0f0f1e] border-[#1a1a2e] text-[#5a5a7a] hover:border-iara-700/40 hover:text-[#9b9bb5]'
                      }`}
                    >
                      {svgIcon ?? <span>{p.icon}</span>}
                      <span>{p.value}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="iara-label">Quais formatos você mais usa?</label>
              <div className="flex flex-wrap gap-2">
                {FORMATOS_OPTS.map((f) => (
                  <ChipToggle key={f} value={f} selected={profile.formatos.includes(f)} onClick={() => toggleArr('formatos', f)}>
                    {f}
                  </ChipToggle>
                ))}
              </div>
            </div>

            <div>
              <label className="iara-label">Com que frequência você posta?</label>
              <div className="space-y-2">
                {FREQUENCIAS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => set('frequencia', f.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
                      profile.frequencia === f.value
                        ? 'bg-iara-600/20 border-iara-600/40 text-iara-300'
                        : 'bg-[#0f0f1e] border-[#1a1a2e] text-[#9b9bb5] hover:border-iara-700/40'
                    }`}
                  >
                    <span className="font-medium">{f.value}</span>
                    <span className="text-xs text-[#5a5a7a]">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="iara-label">
                Descreva um conteúdo seu que bombou — o que você falou e por que acha que funcionou?
                <span className="text-[#5a5a7a] font-normal"> (opcional)</span>
              </label>
              <textarea
                value={profile.conteudo_marcante}
                onChange={(e) => set('conteudo_marcante', e.target.value)}
                placeholder="Ex: Fiz um Reel mostrando os 3 erros que cometia todo dia sem saber que estavam me engordando — sem dieta, sem academia. Bombou porque as pessoas se reconheceram nos erros e ficaram chocadas que algo tão simples poderia estar atrapalhando."
                rows={4}
                className="iara-input resize-none"
              />
              <p className="text-xs text-[#5a5a7a] mt-1.5">A estrutura dos seus melhores conteúdos vira modelo para a IA replicar.</p>
            </div>
          </div>
        )}

        {/* ── STEP 4: Estilo ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="iara-label">Como você se comunica? <span className="text-[#5a5a7a] font-normal">(selecione tudo que te define)</span></label>
              <div className="flex flex-wrap gap-2">
                {TOM_TAGS.map((tag) => (
                  <ChipToggle key={tag} value={tag} selected={tomTags().includes(tag)} onClick={() => toggleTom(tag)}>
                    {tag}
                  </ChipToggle>
                ))}
              </div>
            </div>

            <div>
              <label className="iara-label">O que te diferencia de outros criadores do mesmo nicho?</label>
              <textarea
                value={profile.diferencial}
                onChange={(e) => set('diferencial', e.target.value)}
                placeholder="Ex: Sou o único que mostra os bastidores reais da academia sem filtro. Não vendo suplemento, só falo de treino com ciência."
                rows={3}
                className="iara-input resize-none"
              />
            </div>

            <div>
              <label className="iara-label">Criadores que te inspiram <span className="text-[#5a5a7a] font-normal">(opcional)</span></label>
              <input
                type="text"
                value={profile.inspiracoes}
                onChange={(e) => set('inspiracoes', e.target.value)}
                placeholder="Ex: Thiago Nigro pelo didatismo, Mr. Beast pela escala, Ana Carina pelo storytelling"
                className="iara-input"
              />
            </div>
          </div>
        )}

        {/* ── STEP 5: Objetivos ── */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <label className="iara-label">Qual é o seu objetivo principal agora?</label>
              <div className="grid grid-cols-2 gap-2">
                {OBJETIVOS_OPTS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => set('objetivo', o.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-sm text-left transition-all ${
                      profile.objetivo === o.value
                        ? 'bg-iara-600/20 border-iara-600/40 text-iara-300'
                        : 'bg-[#0f0f1e] border-[#1a1a2e] text-[#9b9bb5] hover:border-iara-700/40'
                    }`}
                  >
                    <span className="text-xl">{o.emoji}</span>
                    <span className="font-medium leading-tight">{o.value}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="iara-label">Qual é o seu maior desafio hoje?</label>
              <div className="flex flex-wrap gap-2">
                {DESAFIOS_OPTS.map((d) => (
                  <ChipToggle key={d} value={d} selected={profile.desafio_principal === d} onClick={() => set('desafio_principal', d)}>
                    {d}
                  </ChipToggle>
                ))}
              </div>
            </div>

            <div>
              <label className="iara-label">Onde você quer estar daqui a 12 meses? <span className="text-[#5a5a7a] font-normal">(opcional)</span></label>
              <textarea
                value={profile.meta_12_meses}
                onChange={(e) => set('meta_12_meses', e.target.value)}
                placeholder="Ex: Chegar a 100K no Instagram, fechar pelo menos 3 parcerias pagas por mês e largar o emprego CLT."
                rows={3}
                className="iara-input resize-none"
              />
            </div>

            <div>
              <label className="iara-label">
                Por que você cria conteúdo? Qual é o propósito real por trás disso tudo?
              </label>
              <textarea
                value={profile.proposito}
                onChange={(e) => set('proposito', e.target.value)}
                placeholder="Ex: Cresci vendo minha mãe passar a vida inteira sem entender de dinheiro e pagando juros absurdos. Quero que ninguém mais precise chegar na meia-idade sem saber o básico de finanças. Não é sobre views, é sobre mudar a relação das pessoas comuns com o dinheiro."
                rows={4}
                className="iara-input resize-none"
              />
              <p className="text-xs text-[#5a5a7a] mt-1.5">Isso é o coração da sua marca. A IA usa isso para garantir que toda sugestão esteja alinhada com o que você realmente representa.</p>
            </div>
          </div>
        )}
      </div>

      {/* Navegação */}
      <div className="flex items-center gap-3 mb-8">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1a1a2e] text-[#9b9bb5] hover:bg-[#1a1a2e] transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
        )}

        {step < STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 iara-btn-primary py-3"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Próximo <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex-1 flex flex-col gap-2">
            <button
              onClick={handleGerarPersona}
              disabled={gerandoPersona || saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-iara-600 to-accent-purple text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {gerandoPersona
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando sua persona…</>
                : <><Sparkles className="w-4 h-4" /> {personaGerada ? 'Regenerar persona com IA' : 'Gerar minha persona com IA'}</>
              }
            </button>
            <button
              onClick={async () => { await saveProfile(); showToast('Perfil salvo!') }}
              disabled={saving || gerandoPersona}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#1a1a2e] text-[#9b9bb5] hover:bg-[#1a1a2e] transition-colors text-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Salvar sem gerar persona
            </button>
          </div>
        )}
      </div>

      {/* Persona gerada */}
      {profile.sobre && (
        <div className="iara-card p-5 border border-iara-700/30 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-iara-600/30 to-accent-purple/20 border border-iara-700/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-iara-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#f1f1f8]">Sua persona gerada pela Iara</p>
              <p className="text-xs text-[#5a5a7a]">Usada em todos os módulos de IA para personalizar as respostas</p>
            </div>
            <button
              onClick={handleGerarPersona}
              disabled={gerandoPersona}
              className="ml-auto flex items-center gap-1.5 text-xs text-[#5a5a7a] hover:text-iara-400 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${gerandoPersona ? 'animate-spin' : ''}`} />
              Regenerar
            </button>
          </div>
          <p className="text-sm text-[#c4c4d8] leading-relaxed whitespace-pre-wrap">{profile.sobre}</p>
        </div>
      )}

      {/* Vídeos de referência */}
      <div className="iara-card p-5 mb-6">
        <div className="mb-4">
          <p className="text-sm font-semibold text-[#f1f1f8] mb-0.5">Vídeos de referência</p>
          <p className="text-xs text-[#5a5a7a]">
            Cole links de vídeos seus ou de outros criadores. A IA vai ler o conteúdo e aprender com o estilo, estrutura e abordagem de cada um.
          </p>
        </div>

        {/* Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdicionarVideo()}
            placeholder="Cole um link do YouTube, TikTok ou Instagram…"
            className="iara-input flex-1"
          />
          <button
            onClick={handleAdicionarVideo}
            disabled={analisandoVideo || !videoUrl.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-iara-600/20 border border-iara-600/40 text-iara-300 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40 flex-shrink-0"
          >
            {analisandoVideo
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analisando…</>
              : <><Play className="w-3.5 h-3.5" /> Adicionar</>
            }
          </button>
        </div>

        {/* Lista de vídeos */}
        {profile.video_referencias.length === 0 ? (
          <p className="text-xs text-[#3a3a5a] text-center py-4">Nenhum vídeo adicionado ainda</p>
        ) : (
          <div className="space-y-2">
            {profile.video_referencias.map((v) => (
              <div key={v.url} className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0a14] border border-[#1a1a2e]">
                {v.thumbnail && (
                  <img src={v.thumbnail} alt="" className="w-14 h-10 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#d0d0e8] truncate">{v.titulo}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[#5a5a7a] capitalize">{v.plataforma}</span>
                    {v.transcricao
                      ? <span className="text-[10px] text-green-400">· transcrição extraída</span>
                      : <span className="text-[10px] text-yellow-500/70">· sem transcrição</span>
                    }
                  </div>
                </div>
                <button
                  onClick={() => handleRemoverVideo(v.url)}
                  className="p-1.5 rounded-lg hover:bg-red-900/30 text-[#5a5a7a] hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Link oratória */}
      <div className="iara-card p-4 flex items-center gap-3 border-dashed border-[#2a2a4e]">
        <div className="w-8 h-8 rounded-lg bg-iara-900/50 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-iara-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#9b9bb5]">Quer uma persona ainda mais precisa?</p>
          <p className="text-xs text-[#5a5a7a]">Faça a análise de oratória — a IA aprende seu tom de voz real.</p>
        </div>
        <Link href="/dashboard/oratorio" className="text-xs text-iara-400 hover:underline flex-shrink-0">
          Ir agora →
        </Link>
      </div>

      {/* Seção LGPD */}
      <DadosPrivacidade />
    </div>
  )
}

// ─── Componente de privacidade / LGPD ─────────────────────────────────────────
function DadosPrivacidade() {
  const [exportando, setExportando] = useState(false)
  const [deletando, setDeletando] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleExportar() {
    setExportando(true)
    try {
      const res = await fetch('/api/usuario/exportar-dados')
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'meus-dados-iara.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Erro ao exportar dados. Tente novamente.')
    } finally {
      setExportando(false)
    }
  }

  async function handleDeletar() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeletando(true)
    try {
      const res = await fetch('/api/usuario/deletar-conta', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      window.location.href = '/login'
    } catch {
      alert('Erro ao deletar conta. Entre em contato: privacidade@iara.app')
      setDeletando(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="iara-card p-6 border border-[#2a2a4e]">
      <h3 className="text-sm font-semibold text-[#9b9bb5] mb-1">Privacidade e seus dados (LGPD)</h3>
      <p className="text-xs text-[#5a5a7a] mb-5">
        Conforme a Lei Geral de Proteção de Dados, você pode exportar ou excluir permanentemente
        todos os seus dados a qualquer momento.{' '}
        <Link href="/privacidade" className="text-iara-400 hover:underline">Ver política de privacidade</Link>
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Exportar */}
        <button
          onClick={handleExportar}
          disabled={exportando}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f0f20] border border-[#1a1a2e] hover:border-iara-700/40 text-[#9b9bb5] hover:text-[#f1f1f8] text-sm font-medium transition-all disabled:opacity-50"
        >
          {exportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          Exportar meus dados (JSON)
        </button>

        {/* Deletar */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/30 border border-red-900/30 hover:border-red-700/50 text-red-400/70 hover:text-red-400 text-sm font-medium transition-all"
          >
            <X className="w-4 h-4" />
            Excluir minha conta
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-400">Tem certeza? Isso é irreversível.</span>
            <button
              onClick={handleDeletar}
              disabled={deletando}
              className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-all disabled:opacity-50"
            >
              {deletando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Sim, excluir tudo'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-2 rounded-lg bg-[#0f0f20] border border-[#1a1a2e] text-[#6b6b8a] text-xs transition-all"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
