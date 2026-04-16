-- ============================================================
-- IARA — Schema v2
-- Execute no SQL Editor do Supabase após o schema_v1
-- ============================================================

-- Adicionar colunas de gamificação ao perfil do criador
alter table public.creator_profiles
  add column if not exists pontos        int default 0,
  add column if not exists nivel         int default 0,
  add column if not exists treinos_voz   int default 0,
  add column if not exists voz_perfil    text,
  add column if not exists voz_score_medio int;

-- Tabela de análises de voz
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

create policy "Users can view own analyses"
  on public.voice_analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.voice_analyses for insert
  with check (auth.uid() = user_id);

-- Tabela de metas de postagem
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

create policy "Users can manage own metas"
  on public.metas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
