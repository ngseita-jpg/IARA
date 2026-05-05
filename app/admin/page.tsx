import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import {
  ShieldAlert, Tag, Receipt, Activity, Sparkles, Users, FileWarning,
  ArrowLeft, Megaphone, BarChart3,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminHubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    redirect('/dashboard')
  }

  const cards = [
    {
      titulo: 'Suspeitos & abuso',
      desc: 'Lista de contas com rate-limit hits, geração anormal, cupom inválido — candidatas a banimento.',
      href: '/admin/suspeitos',
      icon: ShieldAlert,
      cor: 'red',
    },
    {
      titulo: 'Cupons',
      desc: 'Criar, listar, ativar/desativar cupons de desconto. Sincronizado com Stripe.',
      href: '/admin/cupons',
      icon: Tag,
      cor: 'amber',
    },
    {
      titulo: 'Pagamentos afiliados',
      desc: 'Lista de afiliados com saldo elegível pra pagamento via PIX. Marca como pago após enviar.',
      href: '/admin/pagamentos',
      icon: Receipt,
      cor: 'green',
    },
    {
      titulo: 'Audit log',
      desc: 'Eventos críticos do sistema: webhook, login, deleções, erros. Filtrável por evento e período.',
      href: '/admin/audit-log',
      icon: Activity,
      cor: 'iara',
    },
    {
      titulo: 'Marketing Studio',
      desc: 'Squad de agentes de marketing IA — copy, posicionamento, ads, ICP, testes A/B.',
      href: '/dashboard/marketing',
      icon: Megaphone,
      cor: 'pink',
    },
    {
      titulo: 'Diagnóstico Stripe',
      desc: 'Status do checkout, webhook, reconciliação de planos. Ferramenta de troubleshooting.',
      href: '/api/stripe/health',
      icon: BarChart3,
      cor: 'violet',
      external: true,
    },
    {
      titulo: 'Reativar webhook',
      desc: 'Recriar endpoint do webhook Stripe via API se ele for desativado por timeout.',
      href: '/api/admin/stripe-webhook-fix',
      icon: Sparkles,
      cor: 'amber',
      external: true,
    },
    {
      titulo: 'Saúde do banco',
      desc: 'Verificação de schema, colunas faltantes e integridade do Supabase.',
      href: '/api/admin/db-health',
      icon: FileWarning,
      cor: 'iara',
      external: true,
    },
  ]

  const corClasses: Record<string, string> = {
    red:    'border-red-800/40 bg-red-950/20 text-red-300',
    amber:  'border-amber-800/40 bg-amber-950/20 text-amber-300',
    green:  'border-green-800/40 bg-green-950/20 text-green-300',
    iara:   'border-iara-800/40 bg-iara-950/20 text-iara-300',
    pink:   'border-pink-800/40 bg-pink-950/20 text-pink-300',
    violet: 'border-violet-800/40 bg-violet-950/20 text-violet-300',
  }

  return (
    <div className="min-h-screen bg-[#08080f] text-[#f1f1f8]">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link
          href="/conta"
          className="inline-flex items-center gap-2 text-sm text-[#6b6b8a] hover:text-iara-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Minha Conta
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-iara-500 to-accent-purple flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Painel Admin</h1>
        </div>
        <p className="text-sm text-[#6b6b8a] mb-8">
          Olá, <strong className="text-[#f1f1f8]">{user.email}</strong> · acesso restrito a admins.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => {
            const Icon = c.icon
            const props = c.external
              ? { href: c.href, target: '_blank' as const, rel: 'noopener noreferrer' }
              : { href: c.href }
            return (
              <Link
                key={c.titulo}
                {...props}
                className={`block rounded-2xl border ${corClasses[c.cor]} p-5 hover:opacity-90 transition-all active:scale-[0.98]`}
              >
                <Icon className="w-6 h-6 mb-3" />
                <h2 className="text-base font-bold mb-1">{c.titulo}</h2>
                <p className="text-xs leading-relaxed opacity-80">{c.desc}</p>
                {c.external && (
                  <p className="text-[10px] opacity-50 mt-2">↗ abre em nova aba</p>
                )}
              </Link>
            )
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-[#1a1a2e] bg-[#13131f] p-5">
          <h3 className="text-sm font-bold text-iara-400 mb-2">💡 Dica admin</h3>
          <p className="text-xs text-[#9b9bb5] leading-relaxed">
            Quando suspeitos aparecerem em vermelho na aba <strong className="text-red-300">Suspeitos & abuso</strong>, investigue antes de banir: pode ser uso legítimo intenso (criador profissional gera 60-80 carrosseis/semana). Bana só quando houver padrão de compartilhamento (multi-IP em janela curta, login simultâneo de 3+ devices distintos).
          </p>
        </div>
      </div>
    </div>
  )
}
