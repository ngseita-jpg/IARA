-- ═══════════════════════════════════════════════════════════════
-- TRACKING DE USO — MARCA
-- Tabelas pra rastrear consumo de recursos com limite mensal
-- (chat mensagens, análises ROI IA).
-- Rodar 1x no SQL Editor. Idempotente.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.marca_chat_mensagens (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz default now()
);

create index if not exists idx_marca_chat_user on public.marca_chat_mensagens(user_id, created_at desc);
create index if not exists idx_marca_chat_role_created on public.marca_chat_mensagens(role, created_at desc);

alter table public.marca_chat_mensagens enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'marca_chat_mensagens' and policyname = 'users see own chat') then
    create policy "users see own chat" on public.marca_chat_mensagens
      for select using (auth.uid() = user_id);
  end if;
end $$;

-- ═════════════════════════════════════

create table if not exists public.marca_roi_analises (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  resumo      text,
  dados_json  jsonb,
  created_at  timestamptz default now()
);

create index if not exists idx_marca_roi_user on public.marca_roi_analises(user_id, created_at desc);

alter table public.marca_roi_analises enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'marca_roi_analises' and policyname = 'users see own roi') then
    create policy "users see own roi" on public.marca_roi_analises
      for select using (auth.uid() = user_id);
  end if;
end $$;

-- ═════════════════════════════════════
-- Histórico de conteúdo gerado pela marca (carrossel, briefing, match)
-- Único track pra todos os 3 tipos → conta mensal via LIMITES_MARCA
-- ═════════════════════════════════════

create table if not exists public.marca_content_history (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  tipo        text not null check (tipo in ('carrossel', 'briefing', 'match', 'copy', 'relatorio')),
  titulo      text,
  dados_json  jsonb,
  created_at  timestamptz default now()
);

create index if not exists idx_marca_content_user_tipo on public.marca_content_history(user_id, tipo, created_at desc);
create index if not exists idx_marca_content_created on public.marca_content_history(created_at desc);

alter table public.marca_content_history enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'marca_content_history' and policyname = 'users see own content') then
    create policy "users see own content" on public.marca_content_history
      for select using (auth.uid() = user_id);
  end if;
end $$;
