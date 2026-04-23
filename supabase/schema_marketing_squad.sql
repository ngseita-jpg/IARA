-- ═══════════════════════════════════════════════════════════════
-- MARKETING SQUAD — time de agentes IA para brainstorm estratégico
-- Escopo inicial: admin-only. Arquitetura preparada pra multi-tenant
-- (cada marca do plano Agência/Enterprise tem seu próprio squad).
-- ═══════════════════════════════════════════════════════════════

create table if not exists marketing_squad_sessoes (
  id                   bigserial primary key,
  owner_user_id        uuid references auth.users(id) on delete cascade,
  tenant_id            text default 'iara_hub',       -- hoje fixo; futuro: brand_profile_id
  tipo_pedido          text not null,                  -- 'livre', 'campanha', 'preco', 'concorrente', 'publico', 'funil'
  objetivo             text not null,                  -- pergunta/briefing do usuário
  contexto_extra       jsonb default '{}'::jsonb,      -- dados do produto no momento (MRR, plano foco, etc)
  status               text not null default 'gerando' check (
    status in ('gerando', 'pronto', 'falhou', 'arquivado')
  ),
  sintese              text,                            -- síntese final dos agentes (Haiku consolida)
  tokens_input         int default 0,
  tokens_output        int default 0,
  custo_estimado_brl   numeric(10,4) default 0,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

create index if not exists idx_squad_sessoes_owner on marketing_squad_sessoes(owner_user_id, created_at desc);
create index if not exists idx_squad_sessoes_status on marketing_squad_sessoes(status);

alter table marketing_squad_sessoes enable row level security;

drop policy if exists "admin sees all squad sessoes" on marketing_squad_sessoes;
create policy "admin sees all squad sessoes" on marketing_squad_sessoes
  for select using (auth.uid() = owner_user_id);

-- ───────────────────────────────────────────────────────────────
-- Respostas individuais por agente dentro de uma sessão
-- ───────────────────────────────────────────────────────────────

create table if not exists marketing_squad_respostas (
  id                bigserial primary key,
  sessao_id         bigint not null references marketing_squad_sessoes(id) on delete cascade,
  agente            text not null check (agente in (
    'estrategista', 'diretor_conteudo', 'analista_performance',
    'growth_hacker', 'copywriter', 'social_media', 'especialista_preco'
  )),
  resposta          text not null,
  ideias_json       jsonb,                              -- lista estruturada de ideias extraídas
  tokens_input      int default 0,
  tokens_output     int default 0,
  created_at        timestamptz default now()
);

create index if not exists idx_squad_respostas_sessao on marketing_squad_respostas(sessao_id);

alter table marketing_squad_respostas enable row level security;

drop policy if exists "users see own squad respostas" on marketing_squad_respostas;
create policy "users see own squad respostas" on marketing_squad_respostas
  for select using (
    exists (
      select 1 from marketing_squad_sessoes s
      where s.id = marketing_squad_respostas.sessao_id
        and s.owner_user_id = auth.uid()
    )
  );

-- ───────────────────────────────────────────────────────────────
-- Ideias individuais — permite aprovar/rejeitar/executar
-- Útil pra memória: agentes revisitam ideias passadas em próximas sessões
-- ───────────────────────────────────────────────────────────────

create table if not exists marketing_squad_ideias (
  id                bigserial primary key,
  sessao_id         bigint references marketing_squad_sessoes(id) on delete set null,
  owner_user_id     uuid references auth.users(id) on delete cascade,
  agente            text,
  titulo            text not null,
  descricao         text,
  esforco           text check (esforco in ('baixo', 'medio', 'alto')),
  impacto_estimado  text check (impacto_estimado in ('baixo', 'medio', 'alto')),
  categoria         text,                               -- 'canal', 'preco', 'conteudo', 'parceria', 'produto', 'outro'
  status            text not null default 'pendente' check (
    status in ('pendente', 'aprovada', 'rejeitada', 'executando', 'concluida')
  ),
  notas             text,
  created_at        timestamptz default now(),
  atualizada_at     timestamptz default now()
);

create index if not exists idx_squad_ideias_owner on marketing_squad_ideias(owner_user_id, status, created_at desc);
create index if not exists idx_squad_ideias_status on marketing_squad_ideias(status);

alter table marketing_squad_ideias enable row level security;

drop policy if exists "users see own ideias" on marketing_squad_ideias;
create policy "users see own ideias" on marketing_squad_ideias
  for select using (auth.uid() = owner_user_id);

drop policy if exists "users update own ideias" on marketing_squad_ideias;
create policy "users update own ideias" on marketing_squad_ideias
  for update using (auth.uid() = owner_user_id);
