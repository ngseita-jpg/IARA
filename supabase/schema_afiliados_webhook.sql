-- =============================================
-- ATUALIZAÇÃO: webhook_secret + alerta de suspeita
-- Rodar após schema_afiliados.sql
-- =============================================

-- Adiciona webhook_secret em produtos_afiliados (para auto-reporting)
alter table public.produtos_afiliados
  add column if not exists webhook_secret text default encode(gen_random_bytes(24), 'hex');

-- Adiciona flag de suspeita em afiliados
alter table public.afiliados
  add column if not exists suspeito boolean default false,
  add column if not exists suspeito_em timestamptz;

-- Adiciona origem da venda (manual vs webhook)
alter table public.vendas_afiliado
  add column if not exists origem text default 'manual' check (origem in ('manual', 'webhook'));

-- Produto só aparece no catálogo de criadores após a marca confirmar a integração do webhook
alter table public.produtos_afiliados
  add column if not exists webhook_confirmado boolean default false;
