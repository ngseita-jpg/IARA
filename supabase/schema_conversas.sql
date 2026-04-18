-- ============================================================
-- IARA — Schema Conversas (rodar no editor SQL do Supabase)
-- ============================================================

-- Colunas adicionais em vagas (idempotente)
alter table public.vagas add column if not exists segmento text;
alter table public.vagas add column if not exists min_seguidores int default 0;
alter table public.vagas add column if not exists prazo_entrega date;

-- 1. CONVERSAS — canal 1:1 entre marca e criador por candidatura
-- ============================================================
create table if not exists public.conversas (
  id              uuid primary key default gen_random_uuid(),
  candidatura_id  uuid references public.candidaturas(id) on delete cascade not null unique,
  brand_user_id   uuid references auth.users(id) not null,
  creator_user_id uuid references auth.users(id) not null,
  status          text default 'aberta', -- 'aberta', 'proposta_enviada', 'fechado', 'cancelado'
  valor_acordado  numeric(10,2),
  created_at      timestamptz default now()
);

alter table public.conversas enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'conversas' and policyname = 'Participants can manage conversas') then
    create policy "Participants can manage conversas"
      on public.conversas for all
      using (auth.uid() = brand_user_id or auth.uid() = creator_user_id)
      with check (auth.uid() = brand_user_id or auth.uid() = creator_user_id);
  end if;
end $$;

-- 2. MENSAGENS — mensagens dentro de uma conversa
-- ============================================================
create table if not exists public.mensagens (
  id              uuid primary key default gen_random_uuid(),
  conversa_id     uuid references public.conversas(id) on delete cascade not null,
  sender_id       uuid references auth.users(id) not null,
  conteudo        text not null,
  tipo            text default 'texto', -- 'texto', 'proposta', 'aceite', 'recusa'
  proposta_valor  numeric(10,2),
  lida            boolean default false,
  created_at      timestamptz default now()
);

alter table public.mensagens enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'mensagens' and policyname = 'Participants can read mensagens') then
    create policy "Participants can read mensagens"
      on public.mensagens for select
      using (
        exists (
          select 1 from public.conversas
          where id = conversa_id
          and (brand_user_id = auth.uid() or creator_user_id = auth.uid())
        )
      );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'mensagens' and policyname = 'Participants can send mensagens') then
    create policy "Participants can send mensagens"
      on public.mensagens for insert
      with check (
        auth.uid() = sender_id
        and exists (
          select 1 from public.conversas
          where id = conversa_id
          and (brand_user_id = auth.uid() or creator_user_id = auth.uid())
        )
      );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'mensagens' and policyname = 'Participants can mark mensagens read') then
    create policy "Participants can mark mensagens read"
      on public.mensagens for update
      using (
        exists (
          select 1 from public.conversas
          where id = conversa_id
          and (brand_user_id = auth.uid() or creator_user_id = auth.uid())
        )
      );
  end if;
end $$;
