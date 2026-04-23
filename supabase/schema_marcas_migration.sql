-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Schema Marcas — completa colunas faltantes
-- Rode uma vez no SQL Editor do Supabase.
-- Seguro de rodar múltiplas vezes (idempotente).
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Garante que todas as colunas de brand_profiles existam ──
-- (A tabela já existe em produção mas faltava 'segmento' e possivelmente outras)

create table if not exists public.brand_profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade not null unique,
  created_at          timestamptz default now()
);

alter table public.brand_profiles add column if not exists nome_empresa        text;
alter table public.brand_profiles add column if not exists cnpj                text;
alter table public.brand_profiles add column if not exists segmento            text;
alter table public.brand_profiles add column if not exists porte               text;
alter table public.brand_profiles add column if not exists site                text;
alter table public.brand_profiles add column if not exists instagram           text;
alter table public.brand_profiles add column if not exists sobre               text;
alter table public.brand_profiles add column if not exists orcamento_medio     text;
alter table public.brand_profiles add column if not exists nichos_interesse    text[] default '{}';
alter table public.brand_profiles add column if not exists plataformas_foco    text[] default '{}';
alter table public.brand_profiles add column if not exists plano               text default 'free';
alter table public.brand_profiles add column if not exists onboarding_completo boolean default false;
alter table public.brand_profiles add column if not exists updated_at          timestamptz default now();

alter table public.brand_profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'brand_profiles' and policyname = 'Brands can manage own profile') then
    create policy "Brands can manage own profile"
      on public.brand_profiles for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- ── 2. Tabela de vagas (marketplace de campanhas) ──

create table if not exists public.vagas (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid references public.brand_profiles(id) on delete cascade not null,
  nome_empresa    text,
  titulo          text not null,
  descricao       text,
  segmento        text,
  tipo            text default 'pago',
  valor           numeric(10,2),
  entregaveis     text[],
  plataformas     text[] default '{}',
  nichos          text[] default '{}',
  min_seguidores  int default 0,
  prazo_inscricao date,
  prazo_entrega   date,
  status          text default 'aberta',
  created_at      timestamptz default now()
);

alter table public.vagas add column if not exists nome_empresa text;
alter table public.vagas add column if not exists segmento     text;
alter table public.vagas add column if not exists entregaveis  text[];
alter table public.vagas add column if not exists nichos       text[] default '{}';

alter table public.vagas enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'vagas' and policyname = 'Brands can manage own vagas') then
    create policy "Brands can manage own vagas"
      on public.vagas for all
      using (auth.uid() = (select user_id from public.brand_profiles where id = brand_id))
      with check (auth.uid() = (select user_id from public.brand_profiles where id = brand_id));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'vagas' and policyname = 'Creators can view open vagas') then
    create policy "Creators can view open vagas"
      on public.vagas for select
      using (status = 'aberta');
  end if;
end $$;

-- ── 3. Candidaturas (criador se candidata a vaga) ──

create table if not exists public.candidaturas (
  id              uuid primary key default gen_random_uuid(),
  vaga_id         uuid references public.vagas(id) on delete cascade not null,
  creator_id      uuid references public.creator_profiles(id) on delete cascade not null,
  mensagem        text,
  status          text default 'pendente',
  score_match     int,
  created_at      timestamptz default now(),
  unique (vaga_id, creator_id)
);

alter table public.candidaturas enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'candidaturas' and policyname = 'Creators can manage own candidaturas') then
    create policy "Creators can manage own candidaturas"
      on public.candidaturas for all
      using (auth.uid() = (select user_id from public.creator_profiles where id = creator_id))
      with check (auth.uid() = (select user_id from public.creator_profiles where id = creator_id));
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

-- ── 4. Criadores favoritos / salvos pela marca ──

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
      using (auth.uid() = (select user_id from public.brand_profiles where id = brand_id))
      with check (auth.uid() = (select user_id from public.brand_profiles where id = brand_id));
  end if;
end $$;

-- ── 5. Política: marcas podem ver perfis públicos de criadores ──

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'creator_profiles' and policyname = 'Brands can view creator public profiles') then
    create policy "Brands can view creator public profiles"
      on public.creator_profiles for select
      using (
        auth.uid() = user_id
        OR
        exists (select 1 from public.brand_profiles where user_id = auth.uid())
      );
  end if;
end $$;

-- ── 6. Índices úteis ──

create index if not exists idx_vagas_brand on public.vagas(brand_id, status);
create index if not exists idx_vagas_status on public.vagas(status, created_at desc);
create index if not exists idx_candidaturas_vaga on public.candidaturas(vaga_id);
create index if not exists idx_candidaturas_creator on public.candidaturas(creator_id);
create index if not exists idx_criadores_salvos_brand on public.criadores_salvos(brand_id);
create index if not exists idx_brand_profiles_user on public.brand_profiles(user_id);
