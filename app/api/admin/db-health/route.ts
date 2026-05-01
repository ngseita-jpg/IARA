import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Diagnóstico completo do schema do Supabase.
 * Verifica se todas as tabelas, colunas e funções esperadas pelo app existem.
 *
 * Acesso: admin only.
 * GET /api/admin/db-health
 */

type Check = { ok: boolean; nome: string; categoria: string; detalhe?: string; sql_para_rodar?: string }

// Tabelas esperadas (todas as criadas pelos schema_*.sql)
const TABELAS_ESPERADAS = [
  // Core (perfis + auth)
  { nome: 'creator_profiles', schema: 'schema_completo.sql' },
  { nome: 'brand_profiles',   schema: 'schema_marcas.sql' },

  // Conteúdo
  { nome: 'content_history',  schema: 'schema_historico.sql' },
  { nome: 'content_templates',schema: 'schema_wave2.sql ⚠' },
  { nome: 'voice_analyses',   schema: 'schema_completo.sql' },
  { nome: 'metricas_redes',   schema: 'schema_metricas.sql' },
  { nome: 'analises_metricas',schema: 'schema_metricas.sql' },
  { nome: 'metas',            schema: 'schema_completo.sql' },
  { nome: 'calendar_items',   schema: 'schema_completo.sql' },
  { nome: 'user_photos',      schema: 'schema_fotos.sql' },
  { nome: 'cortes_videos',    schema: 'schema_cortes.sql' },
  { nome: 'cortes_trechos',   schema: 'schema_cortes.sql' },
  { nome: 'social_connections', schema: 'schema_oauth.sql' },

  // Marca
  { nome: 'vagas',                schema: 'schema_marcas.sql' },
  { nome: 'candidaturas',         schema: 'schema_marcas.sql' },
  { nome: 'conversas',            schema: 'schema_conversas.sql' },
  { nome: 'mensagens',            schema: 'schema_conversas.sql' },
  { nome: 'criadores_salvos',     schema: 'schema_marcas.sql' },
  { nome: 'marca_chat_mensagens', schema: 'schema_marca_uso.sql' },
  { nome: 'marca_roi_analises',   schema: 'schema_marca_uso.sql' },
  { nome: 'marca_content_history',schema: 'schema_marca_uso.sql' },

  // Afiliados marca-criador
  { nome: 'produtos_afiliados',  schema: 'schema_afiliados.sql' },
  { nome: 'afiliados',           schema: 'schema_afiliados.sql' },
  { nome: 'cliques_afiliado',    schema: 'schema_afiliados.sql' },
  { nome: 'vendas_afiliados',    schema: 'schema_afiliados.sql' },

  // Indicações Iara→Iara
  { nome: 'iara_indicacoes',           schema: 'schema_indicacoes.sql' },
  { nome: 'iara_indicacoes_eventos',   schema: 'schema_indicacoes.sql' },
  { nome: 'iara_indicacoes_pagamentos',schema: 'schema_indicacoes.sql' },

  // Marketing squad (admin)
  { nome: 'marketing_squad_sessoes',  schema: 'schema_marketing_squad.sql' },
  { nome: 'marketing_squad_respostas',schema: 'schema_marketing_squad.sql' },
  { nome: 'marketing_squad_ideias',   schema: 'schema_marketing_squad.sql' },

  // Suporte
  { nome: 'suporte_tickets', schema: 'schema_suporte.sql' },

  // Wave 2 features (RECENTE)
  { nome: 'ia_feedback',     schema: 'schema_wave2.sql ⚠' },
  { nome: 'user_notif_state',schema: 'schema_wave2.sql ⚠' },

  // Segurança (RECENTE)
  { nome: 'rate_limits',     schema: 'schema_security.sql ⚠' },
  { nome: 'api_audit_log',   schema: 'schema_security.sql ⚠' },
]

// Colunas que foram adicionadas em migrações tardias (alterações em tabelas existentes)
const COLUNAS_ESPERADAS = [
  // Wave 2: favorito + handle público + flag de mídia kit público
  { tabela: 'content_history',  coluna: 'favoritado',           schema: 'schema_wave2.sql ⚠' },
  { tabela: 'content_history',  coluna: 'favoritado_em',        schema: 'schema_wave2.sql ⚠' },
  { tabela: 'creator_profiles', coluna: 'handle_publico',       schema: 'schema_wave2.sql ⚠' },
  { tabela: 'creator_profiles', coluna: 'midia_kit_publico',    schema: 'schema_wave2.sql ⚠' },

  // Indicações Iara: PIX + ref_code (criadas em schema_indicacoes.sql)
  { tabela: 'creator_profiles', coluna: 'ref_code',             schema: 'schema_indicacoes.sql' },
  { tabela: 'creator_profiles', coluna: 'pix_recebimento',      schema: 'schema_indicacoes.sql' },
  { tabela: 'creator_profiles', coluna: 'pix_tipo',             schema: 'schema_indicacoes.sql' },

  // Stripe sub_id no perfil
  { tabela: 'creator_profiles', coluna: 'stripe_customer_id',   schema: 'schema_plano.sql' },
  { tabela: 'creator_profiles', coluna: 'stripe_subscription_id',schema: 'schema_plano.sql' },
  { tabela: 'creator_profiles', coluna: 'plano',                schema: 'schema_plano.sql' },
  { tabela: 'brand_profiles',   coluna: 'stripe_customer_id',   schema: 'schema_marcas.sql' },
  { tabela: 'brand_profiles',   coluna: 'stripe_subscription_id',schema: 'schema_marcas.sql' },
  { tabela: 'brand_profiles',   coluna: 'plano',                schema: 'schema_marcas.sql' },
  { tabela: 'brand_profiles',   coluna: 'segmentos',            schema: 'schema_marcas_migration.sql' },
]

// Funções/views esperadas (Postgres)
const FUNCOES_ESPERADAS = [
  { nome: 'rate_limit_check',  schema: 'schema_security.sql ⚠', tipo: 'function' },
  { nome: 'gerar_ref_code',    schema: 'schema_indicacoes.sql', tipo: 'function' },
  { nome: 'iara_indicacoes_saldo', schema: 'schema_indicacoes.sql', tipo: 'view' },
]

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })
  }

  const admin = createAdminClient()
  const checks: Check[] = []

  // 1. Tabelas — tenta SELECT com count head; se falha, tabela não existe
  for (const t of TABELAS_ESPERADAS) {
    try {
      const { error } = await admin.from(t.nome).select('*', { count: 'exact', head: true }).limit(1)
      if (error) {
        checks.push({
          ok: false,
          nome: `tabela ${t.nome}`,
          categoria: 'Tabela faltando',
          detalhe: `Esperada por ${t.schema}`,
          sql_para_rodar: t.schema.replace(' ⚠', ''),
        })
      } else {
        checks.push({ ok: true, nome: `tabela ${t.nome}`, categoria: 'Tabela', detalhe: t.schema.replace(' ⚠', '') })
      }
    } catch (e) {
      checks.push({
        ok: false,
        nome: `tabela ${t.nome}`,
        categoria: 'Tabela faltando',
        detalhe: e instanceof Error ? e.message : 'erro',
        sql_para_rodar: t.schema.replace(' ⚠', ''),
      })
    }
  }

  // 2. Colunas — tenta SELECT específico da coluna
  for (const c of COLUNAS_ESPERADAS) {
    try {
      const { error } = await admin.from(c.tabela).select(c.coluna).limit(1)
      if (error) {
        checks.push({
          ok: false,
          nome: `${c.tabela}.${c.coluna}`,
          categoria: 'Coluna faltando',
          detalhe: `Esperada por ${c.schema}`,
          sql_para_rodar: c.schema.replace(' ⚠', ''),
        })
      } else {
        checks.push({ ok: true, nome: `${c.tabela}.${c.coluna}`, categoria: 'Coluna', detalhe: c.schema.replace(' ⚠', '') })
      }
    } catch (e) {
      checks.push({
        ok: false,
        nome: `${c.tabela}.${c.coluna}`,
        categoria: 'Coluna faltando',
        detalhe: e instanceof Error ? e.message : 'erro',
        sql_para_rodar: c.schema.replace(' ⚠', ''),
      })
    }
  }

  // 3. Funções/views — chama com argumentos dummy pra confirmar que existe
  for (const f of FUNCOES_ESPERADAS) {
    if (f.tipo === 'view') {
      try {
        const { error } = await admin.from(f.nome).select('*').limit(1)
        checks.push(error
          ? {
              ok: false,
              nome: `view ${f.nome}`,
              categoria: 'View faltando',
              detalhe: `Esperada por ${f.schema}`,
              sql_para_rodar: f.schema.replace(' ⚠', ''),
            }
          : { ok: true, nome: `view ${f.nome}`, categoria: 'View', detalhe: f.schema.replace(' ⚠', '') }
        )
      } catch (e) {
        checks.push({
          ok: false,
          nome: `view ${f.nome}`,
          categoria: 'View faltando',
          detalhe: e instanceof Error ? e.message : 'erro',
          sql_para_rodar: f.schema.replace(' ⚠', ''),
        })
      }
    } else {
      // Function: tenta rpc com args dummy seguros
      let testCall: { error: { message: string } | null }
      try {
        if (f.nome === 'rate_limit_check') {
          testCall = await admin.rpc('rate_limit_check', { p_key: 'health_test', p_max: 999, p_window_sec: 60 })
        } else if (f.nome === 'gerar_ref_code') {
          testCall = await admin.rpc('gerar_ref_code')
        } else {
          testCall = { error: null }
        }
        checks.push(testCall.error
          ? {
              ok: false,
              nome: `função ${f.nome}()`,
              categoria: 'Função faltando',
              detalhe: testCall.error.message,
              sql_para_rodar: f.schema.replace(' ⚠', ''),
            }
          : { ok: true, nome: `função ${f.nome}()`, categoria: 'Função', detalhe: f.schema.replace(' ⚠', '') }
        )
      } catch (e) {
        checks.push({
          ok: false,
          nome: `função ${f.nome}()`,
          categoria: 'Função faltando',
          detalhe: e instanceof Error ? e.message : 'erro',
          sql_para_rodar: f.schema.replace(' ⚠', ''),
        })
      }
    }
  }

  const faltando = checks.filter(c => !c.ok)
  const ok = checks.filter(c => c.ok)

  // Agrupa SQLs únicos pra rodar
  const sqlsParaRodar = Array.from(new Set(faltando.map(c => c.sql_para_rodar).filter(Boolean)))

  return NextResponse.json({
    saude: faltando.length === 0 ? 'TUDO OK ✅' : `${faltando.length} item(s) faltando ⚠`,
    total: checks.length,
    ok: ok.length,
    faltando: faltando.length,
    schemas_para_rodar: sqlsParaRodar,
    items_faltando: faltando.map(c => ({
      categoria: c.categoria,
      nome: c.nome,
      detalhe: c.detalhe,
      arquivo_sql: c.sql_para_rodar,
    })),
    items_ok: ok.map(c => `${c.categoria}: ${c.nome}`),
  }, { status: 200 })
}
