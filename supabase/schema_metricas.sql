-- ============================================================
-- IARA — Tabela de Métricas das Redes Sociais
-- ============================================================

create table if not exists public.metricas_redes (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users(id) on delete cascade not null,
  plataforma            text not null,           -- 'instagram' | 'youtube' | 'tiktok' | 'linkedin' | 'twitter'
  seguidores            int default 0,
  alcance_mensal        int default 0,
  impressoes_mensais    int default 0,
  curtidas_mensais      int default 0,
  comentarios_mensais   int default 0,
  compartilhamentos_mensais int default 0,
  salvamentos_mensais   int default 0,
  visualizacoes_mensais int default 0,
  posts_mensais         int default 0,
  taxa_engajamento      numeric(5,2),            -- calculada ou manual
  updated_at            timestamptz default now(),
  created_at            timestamptz default now(),
  unique(user_id, plataforma)
);

alter table public.metricas_redes enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'metricas_redes' and policyname = 'Users can manage own metricas') then
    create policy "Users can manage own metricas" on public.metricas_redes
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- Tabela para salvar análises de IA (histórico)
create table if not exists public.analises_metricas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  analise     text not null,
  created_at  timestamptz default now()
);

alter table public.analises_metricas enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'analises_metricas' and policyname = 'Users can manage own analises') then
    create policy "Users can manage own analises" on public.analises_metricas
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
