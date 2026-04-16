-- ============================================================
-- IARA — Schema v3: Calendário Editorial
-- ============================================================

create table if not exists public.calendar_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  meta_id         uuid references public.metas(id) on delete set null,
  titulo          text not null,
  plataforma      text,
  tipo_conteudo   text default 'post', -- post, reel, story, live, video, carrossel
  data_planejada  date not null,
  concluido       boolean default false,
  concluido_em    timestamptz,
  pontos          int default 5,
  created_at      timestamptz default now()
);

alter table public.calendar_items enable row level security;

create policy "Users can manage own calendar items"
  on public.calendar_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
