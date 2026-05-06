/**
 * Script de setup da conta "oficial" da Iara (iarahubapp@gmail.com).
 *
 * - Verifica se a conta já existe no Supabase Auth
 * - Se não existir, cria com email_confirm=true (sem precisar verificar)
 * - Define/atualiza senha
 * - Cria/atualiza perfil na creator_profiles com a PERSONA completa da Iara
 * - Marca tipo_conta = criador, ref_code único, onboarding_completo=true
 *
 * Uso: npx tsx scripts/setup-conta-iara.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ── Carrega .env.local ─────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8')
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (match) {
      const [, key, rawValue] = match
      const value = rawValue.replace(/^["']|["']$/g, '').trim()
      if (!process.env[key]) process.env[key] = value
    }
  })
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env.local')
  process.exit(1)
}

const supabase = createClient(URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const EMAIL_IARA = 'iarahubapp@gmail.com'
const SENHA_IARA = '81145900Aa*'

// ── Persona da Iara (voz oficial da marca dentro do próprio produto) ──
const PERSONA_IARA = {
  nome_artistico: 'Iara',
  nicho: 'Tecnologia, Marketing Digital, Inteligência Artificial aplicada',
  sub_nicho: 'SaaS brasileiro de IA para criadores e profissionais liberais',
  estagio: 'Em crescimento — produto lançado em 2026',
  historia: 'A Iara nasceu da percepção de que profissionais brasileiros (dentistas, advogados, nutricionistas, coaches e criadores) têm expertise de sobra mas tempo de menos para produzir conteúdo. Desenvolvida no Brasil, pensada para o mercado nacional, entende gírias, contexto cultural e tom de voz brasileiro como nenhuma outra IA.',
  audiencia: 'Criadores de conteúdo brasileiros em crescimento + profissionais liberais que precisam escalar autoridade digital',
  faixa_etaria: '22-45 anos',
  problema_resolvido: 'Falta de tempo para criar conteúdo consistente. Bloqueio criativo. Presença digital irregular. Dificuldade em transformar expertise em conteúdo que converte.',
  publico_real: 'Profissionais liberais (dentistas, advogados, nutricionistas, psicólogos, coaches, arquitetos, consultores) e criadores de conteúdo que querem crescer online sem contratar agência.',
  plataformas: ['Instagram', 'TikTok', 'YouTube', 'LinkedIn'],
  formatos: ['Reels', 'Carrossel', 'Stories', 'Thumbnail', 'Mídia Kit', 'Roteiros'],
  frequencia: '3-5 postagens por semana (recomendado pelos agentes da Iara)',
  conteudo_marcante: 'Tutorial de 60s mostrando um dentista gerando carrossel editorial de "cuidado bucal durante a gravidez" em 2 minutos, do tema à publicação.',
  tom_de_voz: JSON.stringify(['Didática', 'Informal brasileira', 'Direta e provocativa com delicadeza', 'Editorial quando cabe']),
  diferencial: 'Única IA brasileira pensada exclusivamente para criadores e profissionais do Brasil. Entende tom, cultura e referências locais. 11 módulos integrados em um único lugar — roteiros, carrosseis, thumbnails, stories, oratória, mídia kit, métricas, metas.',
  inspiracoes: 'Jasper (qualidade internacional), Nubank (brasilidade), Notion (elegância de produto), Anthropic (qualidade técnica), Hotmart (mercado BR)',
  objetivo: JSON.stringify([
    'Crescer seguidores rapidamente',
    'Construir autoridade no nicho',
    'Fechar parcerias com marcas',
    'Monetizar conteúdo com consistência',
  ]),
  desafio_principal: JSON.stringify([
    'Educar mercado brasileiro sobre IA profissional',
    'Diferenciar-se de concorrentes americanos (Jasper, Copy.ai)',
    'Manter qualidade com escala',
  ]),
  meta_12_meses: 'Consolidar como referência de IA para criadores e profissionais liberais no Brasil. 1.500 pagantes ativos (cenário moderado) a 3.000 (cenário otimista). Presença orgânica forte nas redes via conta oficial.',
  proposito: 'Devolver tempo de volta para quem tem algo a ensinar. 300 horas por ano que o profissional pode usar pra atender mais pessoas, descansar, viver mais — não pra ficar tentando pensar em post no domingo à noite.',
  video_referencias: [],
  sobre: 'A Iara é sua assessora digital com IA. Ela aprende seu tom, seu nicho e seu estilo — e entrega roteiros, carrosseis, thumbnails, stories e mídia kits no seu jeito de falar. Feita no Brasil, pensada para o mercado brasileiro. Não é uma IA genérica que gera texto sem alma: a Iara absorve seu perfil vocal e entrega conteúdo que parece que saiu da sua cabeça, não de uma máquina.',
  pontos: 500,
  nivel: 2,
  treinos_voz: 5,
  voz_perfil: 'Tom editorial brasileiro, direto, com humor pontual. Vocabulário acessível mas não simplório. Usa "a gente" em vez de "nós" quando cabe. Nunca "transforme sua vida" ou "revolucionando". Brevidade > prolixidade.',
  voz_score_medio: 92,
}

// ── Util: gera ref_code único de 8 chars ──
function gerarRefCode(): string {
  return Math.random().toString(36).slice(2, 10)
}

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Setup da conta oficial da Iara (iarahubapp@gmail.com)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // 1. Verifica se a conta existe
  console.log('1️⃣  Procurando conta existente...')
  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 200 })
  if (listErr) {
    console.error('❌ Erro ao listar users:', listErr.message)
    process.exit(1)
  }

  let user = listData.users.find(u => u.email?.toLowerCase() === EMAIL_IARA.toLowerCase())
  let criou = false

  if (user) {
    console.log(`   ♻️  Conta já existe: ${user.id}`)
    console.log(`   ↻  Atualizando senha para ${SENHA_IARA}...`)
    const { error: updErr } = await supabase.auth.admin.updateUserById(user.id, {
      password: SENHA_IARA,
      email_confirm: true,
      user_metadata: { ...user.user_metadata, full_name: 'Iara Hub', tipo_conta: 'criador' },
    })
    if (updErr) {
      console.error('❌ Erro ao atualizar:', updErr.message)
      process.exit(1)
    }
    console.log('   ✓ Senha e metadados atualizados')
  } else {
    console.log('   ✨ Criando nova conta...')
    const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
      email: EMAIL_IARA,
      password: SENHA_IARA,
      email_confirm: true,
      user_metadata: { full_name: 'Iara Hub', tipo_conta: 'criador' },
    })
    if (createErr || !createData.user) {
      console.error('❌ Erro ao criar:', createErr?.message)
      process.exit(1)
    }
    user = createData.user
    criou = true
    console.log(`   ✓ Conta criada: ${user.id}`)
  }

  console.log()
  console.log('2️⃣  Criando/atualizando perfil completo (persona Iara)...')

  // Verifica se já tem ref_code; se não, gera
  const { data: perfilExistente } = await supabase
    .from('creator_profiles')
    .select('ref_code')
    .eq('user_id', user.id)
    .maybeSingle()

  const refCode = perfilExistente?.ref_code ?? gerarRefCode()

  const { error: upsertErr } = await supabase
    .from('creator_profiles')
    .upsert({
      user_id: user.id,
      ...PERSONA_IARA,
      ref_code: refCode,
      onboarding_completo: true,
      plano: 'profissional',   // Iara oficial usa plano Profissional (acesso total)
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (upsertErr) {
    console.error('❌ Erro no upsert do perfil:', upsertErr.message)
    console.error('   Detalhes:', upsertErr)
    process.exit(1)
  }
  console.log('   ✓ Perfil com persona Iara aplicado')
  console.log(`   ✓ ref_code: ${refCode}`)
  console.log(`   ✓ plano: profissional (acesso ilimitado)`)

  console.log()
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  ✅ ${criou ? 'CONTA CRIADA' : 'CONTA ATUALIZADA'} COM SUCESSO`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  📧 Email:    ${EMAIL_IARA}`)
  console.log(`  🔑 Senha:    ${SENHA_IARA}`)
  console.log(`  🆔 User ID:  ${user.id}`)
  console.log(`  🏷️  Ref code: ${refCode}`)
  console.log(`  💎 Plano:    Profissional (ilimitado)`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message)
  process.exit(1)
})
