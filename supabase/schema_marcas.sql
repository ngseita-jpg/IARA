-- ============================================================
-- IARA — Schema Marcas (rodar no editor SQL do Supabase)
-- ============================================================

-- 1. PERFIL DA MARCA
-- ============================================================
create table if not exists public.brand_profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade not null unique,
  nome_empresa        text,
  cnpj                text,
  segmento            text,
  porte               text, -- 'startup', 'pequena', 'media', 'grande', 'agencia'
  site                text,
  instagram           text,
  sobre               text,
  orcamento_medio     text, -- 'ate_5k', '5k_20k', '20k_50k', '50k_mais'
  nichos_interesse    text[] default '{}', -- quais nichos de criador interessa
  plataformas_foco    text[] default '{}', -- quais redes sociais foca
  plano               text default 'free',
  onboarding_completo boolean default false,
  updated_at          timestamptz default now(),
  created_at          timestamptz default now()
);

alter table public.brand_profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'brand_profiles' and policyname = 'Brands can manage own profile') then
    create policy "Brands can manage own profile"
      on public.brand_profiles for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- 2. VAGAS DE CAMPANHA (estrutura base para o marketplace)
-- ============================================================
create table if not exists public.vagas (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid references public.brand_profiles(id) on delete cascade not null,
  nome_empresa    text,                  -- denormalizado para evitar join com RLS
  titulo          text not null,
  descricao       text,
  segmento        text,
  tipo            text default 'pago', -- 'pago', 'recebido'
  valor           numeric(10,2),
  entregaveis     text[],
  plataformas     text[] default '{}',
  nichos          text[] default '{}',
  min_seguidores  int default 0,
  prazo_inscricao date,
  prazo_entrega   date,
  status          text default 'aberta', -- 'aberta', 'encerrada', 'pausada'
  created_at      timestamptz default now()
);

-- Migration: adicionar nome_empresa se a tabela já existir
alter table public.vagas add column if not exists nome_empresa text;

alter table public.vagas enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'vagas' and policyname = 'Brands can manage own vagas') then
    create policy "Brands can manage own vagas"
      on public.vagas for all
      using (
        auth.uid() = (select user_id from public.brand_profiles where id = brand_id)
      )
      with check (
        auth.uid() = (select user_id from public.brand_profiles where id = brand_id)
      );
  end if;
  -- Criadores podem ver vagas abertas
  if not exists (select 1 from pg_policies where tablename = 'vagas' and policyname = 'Creators can view open vagas') then
    create policy "Creators can view open vagas"
      on public.vagas for select
      using (status = 'aberta');
  end if;
end $$;

-- 3. CANDIDATURAS (base para o marketplace — fase 2)
-- ============================================================
create table if not exists public.candidaturas (
  id              uuid primary key default gen_random_uuid(),
  vaga_id         uuid references public.vagas(id) on delete cascade not null,
  creator_id      uuid references public.creator_profiles(id) on delete cascade not null,
  mensagem        text,
  status          text default 'pendente', -- 'pendente', 'aprovada', 'recusada'
  score_match     int,
  created_at      timestamptz default now(),
  unique (vaga_id, creator_id)
);

alter table public.candidaturas enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'candidaturas' and policyname = 'Creators can manage own candidaturas') then
    create policy "Creators can manage own candidaturas"
      on public.candidaturas for all
      using (
        auth.uid() = (select user_id from public.creator_profiles where id = creator_id)
      )
      with check (
        auth.uid() = (select user_id from public.creator_profiles where id = creator_id)
      );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'candidaturas' and policyname = 'Brands can view candidaturas for own vagas') then
    create policy "Brands can view candidaturas for own vagas"
      on public.candidaturas for select
      using (
        auth.uid() = (
          select bp.user_id from public.brand_profiles bp
          join public.vagas v on v.brand_id = bp.id
          where v.id = vaga_id
        )
      );
  end if;
end $$;

-- 4. CRIADORES SALVOS / FAVORITOS pela marca
-- ============================================================
create table if not exists public.criadores_salvos (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid references public.brand_profiles(id) on delete cascade not null,
  creator_id  uuid references public.creator_profiles(id) on delete cascade not null,
  nota        text,
  created_at  timestamptz default now(),
  unique (brand_id, creator_id)
);

alter table public.criadores_salvos enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'criadores_salvos' and policyname = 'Brands can manage own saved creators') then
    create policy "Brands can manage own saved creators"
      on public.criadores_salvos for all
      using (
        auth.uid() = (select user_id from public.brand_profiles where id = brand_id)
      )
      with check (
        auth.uid() = (select user_id from public.brand_profiles where id = brand_id)
      );
  end if;
end $$;

-- 5. POLÍTICA: marcas podem ver perfis públicos de criadores
-- (somente campos seguros — nome, nicho, plataformas, pontos, nivel)
-- A API já filtra os campos, mas esta policy libera o select.
-- ============================================================
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'creator_profiles' and policyname = 'Brands can view creator public profiles') then
    create policy "Brands can view creator public profiles"
      on public.creator_profiles for select
      using (
        -- criador vê o próprio perfil (policy já existia)
        auth.uid() = user_id
        OR
        -- ou o solicitante tem um brand_profile (é uma marca)
        exists (
          select 1 from public.brand_profiles
          where user_id = auth.uid()
        )
      );
  end if;
end $$;
