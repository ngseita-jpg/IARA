import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Instagram, Youtube, Globe, Mail, ExternalLink } from 'lucide-react'
import { joinArr } from '@/lib/parseArr'
import type { Metadata } from 'next'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ handle: string }> }

async function buscarPerfil(handle: string) {
  const handleLimpo = handle.toLowerCase().trim()
  if (!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(handleLimpo)) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('creator_profiles')
    .select('nome_artistico, full_name, nicho, sub_nicho, sobre, plataformas, formatos, audiencia, faixa_etaria, problema_resolvido, tom_de_voz, diferencial, inspiracoes, proposito, instagram_url, youtube_url, tiktok_url, site_url, email_comercial, midia_kit_publico')
    .eq('handle_publico', handleLimpo)
    .maybeSingle()

  if (!data || !data.midia_kit_publico) return null
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const perfil = await buscarPerfil(handle)
  if (!perfil) {
    return { title: 'Mídia Kit não encontrado | Iara Hub' }
  }
  const nome = perfil.nome_artistico ?? perfil.full_name ?? handle
  return {
    title: `${nome} — Mídia Kit | Iara Hub`,
    description: perfil.sobre?.slice(0, 160) ?? `Mídia kit profissional de ${nome}.`,
  }
}

export default async function MidiaKitPublico({ params }: Props) {
  const { handle } = await params
  const perfil = await buscarPerfil(handle)
  if (!perfil) notFound()

  const nome = perfil.nome_artistico ?? perfil.full_name ?? handle
  const plataformas = Array.isArray(perfil.plataformas) ? perfil.plataformas : []
  const formatos = Array.isArray(perfil.formatos) ? perfil.formatos : []

  const social: Array<{ icon: React.ElementType; href: string; label: string }> = []
  if (perfil.instagram_url) social.push({ icon: Instagram, href: perfil.instagram_url, label: 'Instagram' })
  if (perfil.youtube_url) social.push({ icon: Youtube, href: perfil.youtube_url, label: 'YouTube' })
  if (perfil.site_url) social.push({ icon: Globe, href: perfil.site_url, label: 'Site' })

  return (
    <div className="min-h-screen px-4 py-8 sm:py-16" style={{ background: '#08080f' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-iara-600 to-accent-purple mb-5 shadow-2xl shadow-purple-900/30">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{nome}</h1>
          <p className="text-sm text-[#9b9bb5]">
            {perfil.nicho ?? ''}{perfil.sub_nicho ? ` · ${perfil.sub_nicho}` : ''}
          </p>
        </div>

        {/* Sobre */}
        {perfil.sobre && (
          <div className="rounded-3xl border border-[#1a1a2e] bg-[#0f0f1e] p-6 mb-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-iara-400 font-semibold mb-3">Sobre</p>
            <p className="text-sm text-[#c9c9d8] leading-relaxed whitespace-pre-line">{perfil.sobre}</p>
          </div>
        )}

        {/* Audiência */}
        {(perfil.audiencia || perfil.faixa_etaria) && (
          <div className="rounded-3xl border border-[#1a1a2e] bg-[#0f0f1e] p-6 mb-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-iara-400 font-semibold mb-3">Audiência</p>
            {perfil.audiencia && <p className="text-sm text-[#c9c9d8] leading-relaxed mb-2">{perfil.audiencia}</p>}
            {perfil.faixa_etaria && (
              <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-iara-900/40 border border-iara-700/30 text-iara-300">
                {perfil.faixa_etaria}
              </span>
            )}
          </div>
        )}

        {/* Plataformas e formatos */}
        {(plataformas.length > 0 || formatos.length > 0) && (
          <div className="rounded-3xl border border-[#1a1a2e] bg-[#0f0f1e] p-6 mb-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-iara-400 font-semibold mb-3">Como produzo</p>
            {plataformas.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-[#6b6b8a] mb-1.5">Plataformas:</p>
                <div className="flex flex-wrap gap-1.5">
                  {plataformas.map((p: string) => (
                    <span key={p} className="text-xs px-2.5 py-1 rounded-full bg-[#1a1a2e] text-[#c9c9d8]">{p}</span>
                  ))}
                </div>
              </div>
            )}
            {formatos.length > 0 && (
              <div>
                <p className="text-xs text-[#6b6b8a] mb-1.5">Formatos:</p>
                <div className="flex flex-wrap gap-1.5">
                  {formatos.map((f: string) => (
                    <span key={f} className="text-xs px-2.5 py-1 rounded-full bg-[#1a1a2e] text-[#c9c9d8]">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Diferencial / propósito */}
        {(perfil.diferencial || perfil.proposito || perfil.problema_resolvido) && (
          <div className="rounded-3xl border border-[#1a1a2e] bg-[#0f0f1e] p-6 mb-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-iara-400 font-semibold mb-3">Diferencial</p>
            {perfil.diferencial && <p className="text-sm text-[#c9c9d8] leading-relaxed mb-2">{perfil.diferencial}</p>}
            {perfil.problema_resolvido && (
              <p className="text-sm text-[#9b9bb5] leading-relaxed mb-2">
                <span className="text-[#6b6b8a]">Problema que resolvo: </span>
                {perfil.problema_resolvido}
              </p>
            )}
            {perfil.proposito && (
              <p className="text-sm text-[#9b9bb5] leading-relaxed italic">&ldquo;{perfil.proposito}&rdquo;</p>
            )}
          </div>
        )}

        {/* Tom de voz */}
        {perfil.tom_de_voz && (
          <div className="rounded-3xl border border-[#1a1a2e] bg-[#0f0f1e] p-6 mb-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-iara-400 font-semibold mb-3">Tom de voz</p>
            <p className="text-sm text-[#c9c9d8]">{joinArr(perfil.tom_de_voz)}</p>
          </div>
        )}

        {/* Contato + redes */}
        {(social.length > 0 || perfil.email_comercial) && (
          <div className="rounded-3xl border border-iara-700/30 bg-gradient-to-br from-iara-900/20 to-[#0f0f1e] p-6 mb-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-iara-400 font-semibold mb-3">Bora trabalhar juntos?</p>
            {perfil.email_comercial && (
              <a
                href={`mailto:${perfil.email_comercial}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0a0a14] border border-iara-700/40 text-white hover:border-iara-500/60 transition-all mb-3"
              >
                <Mail className="w-4 h-4 text-iara-400 flex-shrink-0" />
                <span className="text-sm flex-1 truncate">{perfil.email_comercial}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#6b6b8a]" />
              </a>
            )}
            {social.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {social.map(s => {
                  const Icon = s.icon
                  return (
                    <a
                      key={s.href}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#0a0a14] border border-[#1a1a2e] text-[#c9c9d8] hover:border-iara-700/40 hover:text-white transition-all text-sm"
                    >
                      <Icon className="w-4 h-4 text-iara-400" />
                      {s.label}
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer Iara */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#5a5a7a] hover:text-iara-400 transition-colors"
          >
            Mídia Kit gerado com{' '}
            <span className="iara-gradient-text font-bold">Iara Hub</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
