-- ═══════════════════════════════════════════════════════════════
-- PROGRAMA DE INDICAÇÕES IARA HUB
-- Sistema de afiliados: 50% primeira venda + 10% recorrente × 12 meses
-- ═══════════════════════════════════════════════════════════════

-- 1. Código único de afiliado por usuário + chave PIX ----------------
alter table creator_profiles
  add column if not exists ref_code          text unique,
  add column if not exists pix_recebimento   text,
  add column if not exists pix_tipo          text check (pix_tipo in ('cpf','cnpj','email','celular','aleatoria'));

create index if not exists idx_creator_profiles_ref_code on creator_profiles(ref_code);

-- Função: gera ref_code único de 8 chars alfanuméricos
create or replace function gerar_ref_code() returns text language plpgsql as $$
declare
  codigo text;
  existe boolean;
begin
  loop
    codigo := lower(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    select exists(select 1 from creator_profiles where ref_code = codigo) into existe;
    exit when not existe;
  end loop;
  return codigo;
end;
$$;

-- Preenche ref_code de usuários existentes
update creator_profiles
set ref_code = gerar_ref_code()
where ref_code is null;

-- 2. Tabela de indicações --------------------------------------------
create table if not exists iara_indicacoes (
  id                         bigserial primary key,
  indicador_user_id          uuid not null references auth.users(id) on delete cascade,
  indicado_user_id           uuid not null references auth.users(id) on delete cascade,
  status                     text not null default 'pendente' check (
    status in ('pendente', 'ativada', 'cancelada', 'expirada')
  ),

  -- dados do pagamento base
  plano                      text,
  stripe_subscription_id     text,
  valor_primeira_venda       numeric(10,2),
  valor_recorrente_mensal    numeric(10,2),

  -- controle da recorrência
  meses_recorrencia_total    int default 12,
  meses_recorrencia_pagos    int default 0,
  valor_total_apurado        numeric(10,2) default 0,

  created_at                 timestamptz default now(),
  ativada_at                 timestamptz,
  cancelada_at               timestamptz,

  -- unique impede duplicar indicações para o mesmo indicado
  unique(indicado_user_id)
);

create index if not exists idx_indicacoes_indicador on iara_indicacoes(indicador_user_id);
create index if not exists idx_indicacoes_status on iara_indicacoes(status);
create index if not exists idx_indicacoes_sub on iara_indicacoes(stripe_subscription_id);

alter table iara_indicacoes enable row level security;

drop policy if exists "users see own referrals" on iara_indicacoes;
create policy "users see own referrals" on iara_indicacoes
  for select using (auth.uid() = indicador_user_id);

-- 3. Histórico de apurações (cada cobrança que gera comissão) --------
create table if not exists iara_indicacoes_eventos (
  id                  bigserial primary key,
  indicacao_id        bigint not null references iara_indicacoes(id) on delete cascade,
  tipo                text not null check (tipo in ('primeira_venda', 'recorrencia', 'estorno')),
  valor_pagamento     numeric(10,2) not null,   -- quanto o indicado pagou
  pct_comissao        numeric(5,2) not null,    -- 50 ou 10
  valor_comissao      numeric(10,2) not null,   -- quanto o indicador ganha
  stripe_invoice_id   text,
  created_at          timestamptz default now()
);

create index if not exists idx_eventos_indicacao on iara_indicacoes_eventos(indicacao_id);
create index if not exists idx_eventos_tipo on iara_indicacoes_eventos(tipo);

alter table iara_indicacoes_eventos enable row level security;

drop policy if exists "users see own referral events" on iara_indicacoes_eventos;
create policy "users see own referral events" on iara_indicacoes_eventos
  for select using (
    exists (
      select 1 from iara_indicacoes i
      where i.id = iara_indicacoes_eventos.indicacao_id
        and i.indicador_user_id = auth.uid()
    )
  );

-- 4. Pagamentos mensais para afiliados -------------------------------
create table if not exists iara_indicacoes_pagamentos (
  id                   bigserial primary key,
  indicador_user_id    uuid not null references auth.users(id) on delete cascade,
  referencia_mes       text not null,           -- "2026-04"
  valor_total          numeric(10,2) not null,
  eventos_ids          bigint[] not null,       -- array dos eventos pagos nesse ciclo
  pix_chave            text not null,
  pix_tipo             text,
  status               text not null default 'pendente' check (
    status in ('pendente', 'pago', 'falhou')
  ),
  pago_at              timestamptz,
  comprovante_url      text,
  observacoes          text,
  created_at           timestamptz default now()
);

create index if not exists idx_pagamentos_indicador on iara_indicacoes_pagamentos(indicador_user_id);
create index if not exists idx_pagamentos_referencia on iara_indicacoes_pagamentos(referencia_mes);
create index if not exists idx_pagamentos_status on iara_indicacoes_pagamentos(status);

alter table iara_indicacoes_pagamentos enable row level security;

drop policy if exists "users see own payouts" on iara_indicacoes_pagamentos;
create policy "users see own payouts" on iara_indicacoes_pagamentos
  for select using (auth.uid() = indicador_user_id);

-- 5. View útil: saldo por afiliado -----------------------------------
create or replace view iara_indicacoes_saldo as
select
  i.indicador_user_id,
  count(distinct i.id) filter (where i.status = 'ativada') as indicacoes_ativas,
  count(distinct i.id) filter (where i.status = 'pendente') as indicacoes_pendentes,
  coalesce(sum(e.valor_comissao) filter (where e.tipo in ('primeira_venda', 'recorrencia')), 0) as total_apurado,
  coalesce(sum(e.valor_comissao) filter (where e.tipo = 'estorno'), 0) * -1 as total_estornado,
  coalesce(sum(p.valor_total) filter (where p.status = 'pago'), 0) as total_pago,
  -- saldo pendente = apurado - estornado - pago
  coalesce(sum(e.valor_comissao) filter (where e.tipo in ('primeira_venda', 'recorrencia')), 0)
    + coalesce(sum(e.valor_comissao) filter (where e.tipo = 'estorno'), 0)
    - coalesce(sum(p.valor_total) filter (where p.status = 'pago'), 0)
  as saldo_pendente
from iara_indicacoes i
left join iara_indicacoes_eventos e on e.indicacao_id = i.id
left join iara_indicacoes_pagamentos p on p.indicador_user_id = i.indicador_user_id
group by i.indicador_user_id;
