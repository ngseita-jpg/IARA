'use client'

import { useState } from 'react'
import { RefreshCw, Link2, Unlink, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
import { getPlatformIcon } from '@/components/platform-icons'

interface Connection {
  platform: string
  platform_username: string | null
  connected_at: string
  token_expires_at: string | null
}

interface Platform {
  id: string
  label: string
  oauthPath: string
  bg: string
  border: string
  text: string
  setupUrl: string
  setupSteps: string[]
  limitNote?: string
}

const PLATFORMS: Platform[] = [
  {
    id: 'youtube',
    label: 'YouTube',
    oauthPath: '/api/oauth/google',
    bg: 'bg-red-900/20',
    border: 'border-red-800/30',
    text: 'text-red-400',
    setupUrl: 'https://console.cloud.google.com',
    setupSteps: [
      'Acesse console.cloud.google.com e crie um projeto',
      'Ative as APIs: "YouTube Data API v3" e "YouTube Analytics API"',
      'Em "Credenciais", crie um OAuth 2.0 Client ID (tipo: Web application)',
      'Adicione como URL de redirecionamento: [SEU_DOMINIO]/api/oauth/google/callback',
      'Copie o Client ID e Client Secret para o .env: GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET',
      'Adicione NEXT_PUBLIC_APP_URL=[SEU_DOMINIO] no .env',
    ],
  },
  {
    id: 'instagram',
    label: 'Instagram',
    oauthPath: '/api/oauth/instagram',
    bg: 'bg-pink-900/20',
    border: 'border-pink-800/30',
    text: 'text-pink-400',
    setupUrl: 'https://developers.facebook.com',
    setupSteps: [
      'Acesse developers.facebook.com e crie um App (tipo: Business)',
      'Adicione o produto "Instagram Graph API"',
      'Em Configurações > Básico, copie o App ID e App Secret',
      'Adicione como URL de redirecionamento: [SEU_DOMINIO]/api/oauth/instagram/callback',
      'Salve no .env: META_APP_ID e META_APP_SECRET',
      'Sua conta Instagram deve ser Business ou Creator vinculada a uma Página do Facebook',
    ],
    limitNote: 'Requer conta Instagram Business ou Creator',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    oauthPath: '/api/oauth/tiktok',
    bg: 'bg-cyan-900/20',
    border: 'border-cyan-800/30',
    text: 'text-cyan-400',
    setupUrl: 'https://developers.tiktok.com',
    setupSteps: [
      'Acesse developers.tiktok.com e crie uma conta de desenvolvedor',
      'Crie um app em "My Apps" — escolha "Web"',
      'Adicione os escopos: user.info.basic, user.info.stats, video.list',
      'Adicione como Redirect URI: [SEU_DOMINIO]/api/oauth/tiktok/callback',
      'Salve no .env: TIKTOK_CLIENT_KEY e TIKTOK_CLIENT_SECRET',
    ],
    limitNote: 'App precisa ser aprovado pelo TikTok (até 7 dias)',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    oauthPath: '/api/oauth/linkedin',
    bg: 'bg-blue-900/20',
    border: 'border-blue-800/30',
    text: 'text-blue-400',
    setupUrl: 'https://www.linkedin.com/developers',
    setupSteps: [
      'Acesse linkedin.com/developers e crie um app',
      'Em "Auth", adicione como Redirect URL: [SEU_DOMINIO]/api/oauth/linkedin/callback',
      'Solicite os produtos "Sign In with LinkedIn using OpenID Connect"',
      'Salve no .env: LINKEDIN_CLIENT_ID e LINKEDIN_CLIENT_SECRET',
    ],
    limitNote: 'Métricas detalhadas disponíveis apenas para Páginas (não perfis pessoais)',
  },
]

export function SocialConnect({
  connections,
  onSync,
  onDisconnect,
}: {
  connections: Connection[]
  onSync: (platform: string) => Promise<void>
  onDisconnect: (platform: string) => Promise<void>
}) {
  const [openSetup, setOpenSetup] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  function getConnection(platformId: string) {
    return connections.find((c) => c.platform === platformId) ?? null
  }

  async function handleSync(platformId: string) {
    setSyncing(platformId)
    await onSync(platformId)
    setSyncing(null)
  }

  async function handleDisconnect(platformId: string) {
    setDisconnecting(platformId)
    await onDisconnect(platformId)
    setDisconnecting(null)
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-[#5a5a7a] uppercase tracking-wider">
          Contas conectadas
        </h2>
        <span className="text-xs text-[#5a5a7a]">
          {connections.length} de {PLATFORMS.length} conectadas
        </span>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {PLATFORMS.map((plat) => {
          const conn = getConnection(plat.id)
          const isSetupOpen = openSetup === plat.id
          const isSyncing = syncing === plat.id
          const isDisconnecting = disconnecting === plat.id

          return (
            <div
              key={plat.id}
              className={`iara-card p-4 border transition-colors ${
                conn ? `${plat.bg} ${plat.border}` : 'border-[#1a1a2e]'
              }`}
            >
              {/* Header do card */}
              <div className="flex items-center gap-2.5 mb-3">
                {getPlatformIcon(plat.id, 22)}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${conn ? plat.text : 'text-[#9b9bb5]'}`}>
                    {plat.label}
                  </p>
                  {conn ? (
                    <p className="text-xs text-[#5a5a7a] truncate">
                      {conn.platform_username ?? 'Conectado'}
                    </p>
                  ) : (
                    <p className="text-xs text-[#5a5a7a]">Não conectado</p>
                  )}
                </div>
                {conn
                  ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  : <AlertCircle className="w-4 h-4 text-[#3a3a5a] flex-shrink-0" />
                }
              </div>

              {/* Ações */}
              {conn ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSync(plat.id)}
                    disabled={isSyncing}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${plat.bg} ${plat.text} hover:opacity-80 disabled:opacity-50`}
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Sincronizando…' : 'Sincronizar'}
                  </button>
                  <button
                    onClick={() => handleDisconnect(plat.id)}
                    disabled={isDisconnecting}
                    className="p-1.5 rounded-lg hover:bg-red-900/30 text-[#5a5a7a] hover:text-red-400 transition-colors"
                    title="Desconectar"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <a
                    href={plat.oauthPath}
                    className={`flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-medium border ${plat.border} ${plat.text} hover:${plat.bg} transition-colors`}
                  >
                    <Link2 className="w-3 h-3" />
                    Conectar
                  </a>
                  <button
                    onClick={() => setOpenSetup(isSetupOpen ? null : plat.id)}
                    className="flex items-center justify-center gap-1 w-full py-1 text-xs text-[#5a5a7a] hover:text-[#9b9bb5] transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {isSetupOpen ? 'Fechar instruções' : 'Ver como configurar'}
                  </button>
                </div>
              )}

              {/* Instruções de setup */}
              {isSetupOpen && (
                <div className="mt-3 pt-3 border-t border-[#1a1a2e]">
                  {plat.limitNote && (
                    <p className="text-xs text-yellow-400/80 mb-2">⚠ {plat.limitNote}</p>
                  )}
                  <ol className="space-y-1.5">
                    {plat.setupSteps.map((step, i) => (
                      <li key={i} className="flex gap-2 text-xs text-[#9b9bb5]">
                        <span className="text-[#5a5a7a] flex-shrink-0 font-mono">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <a
                    href={plat.setupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-3 flex items-center gap-1 text-xs ${plat.text} hover:underline`}
                  >
                    Abrir painel de dev <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
