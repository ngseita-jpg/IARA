-- ============================================================
-- IARA — Histórico de Conteúdo Gerado
-- Execute no SQL Editor do Supabase
-- ============================================================

create table if not exists public.content_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  tipo        text not null check (tipo in ('roteiro','carrossel','stories','thumbnail')),
  titulo      text not null,
  parametros  jsonb default '{}',
  conteudo    jsonb not null,
  created_at  timestamptz default now()
);

create index if not exists content_history_user_tipo_idx
  on public.content_history (user_id, tipo, created_at desc);

alter table public.content_history enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'content_history'
    and policyname = 'Users can manage own history'
  ) then
    create policy "Users can manage own history" on public.content_history
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
