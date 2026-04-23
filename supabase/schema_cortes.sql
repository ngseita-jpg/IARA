-- ═══════════════════════════════════════════════════════════════
-- IARA CORTES — recortes inteligentes de vídeos do YouTube com IA
-- Disponível para criador e marca (limites por plano).
-- Rodar 1x no SQL Editor. Idempotente.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.cortes_videos (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  tipo_conta       text not null default 'criador' check (tipo_conta in ('criador', 'marca')),
  url_original     text not null,
  video_id         text,                              -- ID do YouTube (ex: "dQw4w9WgXcQ")
  titulo           text,
  duracao_segundos int,
  transcricao      text,                              -- texto completo
  idioma           text default 'pt',
  status           text not null default 'processando' check (
    status in ('processando', 'pronto', 'falhou')
  ),
  erro             text,
  created_at       timestamptz default now(),
  atualizado_at    timestamptz default now()
);

create index if not exists idx_cortes_videos_user on public.cortes_videos(user_id, created_at desc);
create index if not exists idx_cortes_videos_status on public.cortes_videos(status);

alter table public.cortes_videos enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'cortes_videos' and policyname = 'users see own videos') then
    create policy "users see own videos" on public.cortes_videos
      for select using (auth.uid() = user_id);
  end if;
end $$;

-- ───────────────────────────────────────────────────────────────
-- Cortes individuais sugeridos por vídeo
-- ───────────────────────────────────────────────────────────────

create table if not exists public.cortes_trechos (
  id                  uuid primary key default gen_random_uuid(),
  video_id            uuid not null references public.cortes_videos(id) on delete cascade,
  ordem               int not null,
  titulo              text not null,
  descricao           text,
  hook                text,                            -- gancho pra primeira linha da legenda
  inicio_segundos     numeric(10,2) not null,
  fim_segundos        numeric(10,2) not null,
  duracao_segundos    numeric(6,2) generated always as (fim_segundos - inicio_segundos) stored,
  plataforma_ideal    text check (plataforma_ideal in ('reels', 'shorts', 'tiktok', 'feed', 'linkedin')),
  hashtags            text[] default '{}',
  transcricao_trecho  text,
  score_qualidade     int check (score_qualidade between 0 and 100),
  -- Config de legenda (o usuário edita e salva aqui)
  legenda_config      jsonb default '{}'::jsonb,
  created_at          timestamptz default now()
);

create index if not exists idx_cortes_trechos_video on public.cortes_trechos(video_id, ordem);

alter table public.cortes_trechos enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'cortes_trechos' and policyname = 'users see own trechos') then
    create policy "users see own trechos" on public.cortes_trechos
      for select using (
        exists (
          select 1 from public.cortes_videos v
          where v.id = cortes_trechos.video_id
            and v.user_id = auth.uid()
        )
      );
  end if;
end $$;
