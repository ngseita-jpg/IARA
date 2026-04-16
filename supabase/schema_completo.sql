-- ============================================================
-- IARA — Schema Completo (rode esse, ignora os anteriores)
-- Usa IF NOT EXISTS em tudo — seguro rodar mesmo se já existir
-- ============================================================

-- 1. PERFIL DO CRIADOR
-- ============================================================
create table if not exists public.creator_profiles (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null unique,
  nome_artistico text,
  nicho          text,
  tom_de_voz     text,
  plataformas    text[] default '{}',
  objetivo       text,
  sobre          text,
  pontos         int default 0,
  nivel          int default 0,
  treinos_voz    int default 0,
  voz_perfil     text,
  voz_score_medio int,
  updated_at     timestamptz default now(),
  created_at     timestamptz default now()
);

alter table public.creator_profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'creator_profiles' and policyname = 'Users can view own profile') then
    create policy "Users can view own profile" on public.creator_profiles for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'creator_profiles' and policyname = 'Users can insert own profile') then
    create policy "Users can insert own profile" on public.creator_profiles for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'creator_profiles' and policyname = 'Users can update own profile') then
    create policy "Users can update own profile" on public.creator_profiles for update using (auth.uid() = user_id);
  end if;
end $$;

-- 2. ANÁLISES DE VOZ
-- ============================================================
create table if not exists public.voice_analyses (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade not null,
  transcript          text,
  duracao_segundos    int,
  palavras_por_minuto int,
  score_confianca     int,
  score_energia       int,
  score_fluidez       int,
  score_emocao        int,
  score_clareza       int,
  score_total         int,
  feedback            text,
  exercicios          text[],
  perfil_voz          text,
  created_at          timestamptz default now()
);

alter table public.voice_analyses enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'voice_analyses' and policyname = 'Users can view own analyses') then
    create policy "Users can view own analyses" on public.voice_analyses for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'voice_analyses' and policyname = 'Users can insert own analyses') then
    create policy "Users can insert own analyses" on public.voice_analyses for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- 3. METAS DE POSTAGEM
-- ============================================================
create table if not exists public.metas (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users(id) on delete cascade not null,
  titulo             text not null,
  descricao          text,
  plataforma         text,
  meta_tipo          text default 'postagens',
  quantidade_meta    int default 1,
  quantidade_atual   int default 0,
  data_limite        date,
  pontos_recompensa  int default 25,
  status             text default 'ativa',
  concluida_em       timestamptz,
  created_at         timestamptz default now()
);

alter table public.metas enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'metas' and policyname = 'Users can manage own metas') then
    create policy "Users can manage own metas" on public.metas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- 4. CALENDÁRIO EDITORIAL
-- ============================================================
create table if not exists public.calendar_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  meta_id         uuid references public.metas(id) on delete set null,
  titulo          text not null,
  plataforma      text,
  tipo_conteudo   text default 'post',
  data_planejada  date not null,
  concluido       boolean default false,
  concluido_em    timestamptz,
  pontos          int default 5,
  created_at      timestamptz default now()
);

alter table public.calendar_items enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'calendar_items' and policyname = 'Users can manage own calendar items') then
    create policy "Users can manage own calendar items" on public.calendar_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
