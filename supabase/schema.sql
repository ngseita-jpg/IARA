-- ============================================================
-- IARA — Schema Supabase
-- Execute no SQL Editor do seu projeto Supabase
-- ============================================================

-- Tabela de perfis de criadores
create table if not exists public.creator_profiles (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null unique,
  nome_artistico text,
  nicho          text,
  tom_de_voz     text,
  plataformas    text[] default '{}',
  objetivo       text,
  sobre          text,
  updated_at     timestamptz default now(),
  created_at     timestamptz default now()
);

-- Row Level Security
alter table public.creator_profiles enable row level security;

create policy "Users can view own profile"
  on public.creator_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.creator_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.creator_profiles for update
  using (auth.uid() = user_id);
