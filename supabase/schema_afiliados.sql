-- =============================================
-- PROGRAMA DE AFILIADOS — IARA HUB
-- =============================================

-- 1. Produtos cadastrados pelas marcas
create table if not exists public.produtos_afiliados (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid references public.brand_profiles(id) on delete cascade not null,
  titulo          text not null,
  descricao       text,
  url_produto     text not null,
  preco           numeric(10,2),
  imagem_url      text,
  comissao_pct    numeric(5,2) not null default 10,  -- % que vai para o criador
  desconto_pct    numeric(5,2) not null default 10,  -- % de desconto no cupom
  ativo           boolean default true,
  created_at      timestamptz default now()
);

-- 2. Afiliações: criador se vincula a um produto e recebe cupom único
create table if not exists public.afiliados (
  id                   uuid primary key default gen_random_uuid(),
  produto_id           uuid references public.produtos_afiliados(id) on delete cascade not null,
  creator_id           uuid references public.creator_profiles(id) on delete cascade not null,
  cupom_codigo         text unique not null,
  status               text not null default 'ativo' check (status in ('ativo', 'inativo')),
  cliques              integer default 0,
  vendas_confirmadas   integer default 0,
  comissao_total       numeric(10,2) default 0,
  created_at           timestamptz default now(),
  unique(produto_id, creator_id)
);

-- 3. Vendas confirmadas manualmente pela marca
create table if not exists public.vendas_afiliado (
  id                uuid primary key default gen_random_uuid(),
  afiliado_id       uuid references public.afiliados(id) on delete cascade not null,
  valor_venda       numeric(10,2) not null,
  comissao_criador  numeric(10,2) not null,  -- 90% da comissão do produto
  comissao_iara     numeric(10,2) not null,  -- 10% da comissão do produto
  observacoes       text,
  created_at        timestamptz default now()
);

-- =============================================
-- RLS
-- =============================================

alter table public.produtos_afiliados enable row level security;
alter table public.afiliados enable row level security;
alter table public.vendas_afiliado enable row level security;

-- Produtos: marcas gerenciam os seus; criadores veem ativos
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'produtos_afiliados' and policyname = 'Brands manage their products') then
    create policy "Brands manage their products" on public.produtos_afiliados
      for all using (brand_id in (select id from public.brand_profiles where user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'produtos_afiliados' and policyname = 'Creators view active products') then
    create policy "Creators view active products" on public.produtos_afiliados
      for select using (ativo = true);
  end if;
end $$;

-- Afiliados: criador gerencia os seus; marca vê e atualiza os do seu produto
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'afiliados' and policyname = 'Creators manage their affiliations') then
    create policy "Creators manage their affiliations" on public.afiliados
      for all using (creator_id in (select id from public.creator_profiles where user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'afiliados' and policyname = 'Brands view affiliations') then
    create policy "Brands view affiliations" on public.afiliados
      for select using (produto_id in (
        select id from public.produtos_afiliados where brand_id in (
          select id from public.brand_profiles where user_id = auth.uid()
        )
      ));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'afiliados' and policyname = 'Brands update affiliations') then
    create policy "Brands update affiliations" on public.afiliados
      for update using (produto_id in (
        select id from public.produtos_afiliados where brand_id in (
          select id from public.brand_profiles where user_id = auth.uid()
        )
      ));
  end if;
end $$;

-- Vendas: marca insere; criador e marca podem ver
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'vendas_afiliado' and policyname = 'Brands insert sales') then
    create policy "Brands insert sales" on public.vendas_afiliado
      for insert with check (afiliado_id in (
        select a.id from public.afiliados a
        join public.produtos_afiliados p on p.id = a.produto_id
        join public.brand_profiles b on b.id = p.brand_id
        where b.user_id = auth.uid()
      ));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'vendas_afiliado' and policyname = 'Creators view their sales') then
    create policy "Creators view their sales" on public.vendas_afiliado
      for select using (afiliado_id in (
        select a.id from public.afiliados a
        join public.creator_profiles c on c.id = a.creator_id
        where c.user_id = auth.uid()
      ));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'vendas_afiliado' and policyname = 'Brands view sales') then
    create policy "Brands view sales" on public.vendas_afiliado
      for select using (afiliado_id in (
        select a.id from public.afiliados a
        join public.produtos_afiliados p on p.id = a.produto_id
        join public.brand_profiles b on b.id = p.brand_id
        where b.user_id = auth.uid()
      ));
  end if;
end $$;
