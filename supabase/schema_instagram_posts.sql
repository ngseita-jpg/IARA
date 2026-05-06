-- ============================================================
-- Instagram Posts importados — Performance Loop (2026-05-05)
-- ============================================================
-- Cache local dos ultimos posts do user no Instagram. Alimenta o prompt
-- da IA: "carrosseis seus que bombaram tem padrao X". Moat estrutural —
-- ChatGPT nunca tera esses dados.
--
-- SALVAGUARDAS hard-coded no codigo:
-- - Maximo 60 posts importados por user (suficiente pra padrao + barato)
-- - Refresh maximo 1x/dia por user (poupa cota Graph API + custo)

CREATE TABLE IF NOT EXISTS public.instagram_posts_user (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ig_post_id      text NOT NULL,                          -- ID do post no Instagram
  permalink       text,                                   -- URL publico
  media_type      text,                                   -- IMAGE | VIDEO | CAROUSEL_ALBUM
  thumbnail_url   text,
  caption         text,                                   -- texto do post (truncado a 2000 chars)
  posted_at       timestamptz,
  like_count      integer DEFAULT 0,
  comments_count  integer DEFAULT 0,
  reach           integer DEFAULT 0,                      -- so disponivel via Insights API
  saves           integer DEFAULT 0,
  importado_em    timestamptz DEFAULT now(),
  CONSTRAINT instagram_post_user_unique UNIQUE (user_id, ig_post_id)
);

ALTER TABLE public.instagram_posts_user ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users veem só seus posts"
  ON public.instagram_posts_user FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_insta_posts_user_engagement
  ON public.instagram_posts_user (user_id, like_count DESC, comments_count DESC);

CREATE INDEX IF NOT EXISTS idx_insta_posts_user_data
  ON public.instagram_posts_user (user_id, posted_at DESC);

-- Coluna pra controlar refresh (anti-abuso de cota Graph API)
ALTER TABLE public.social_connections
  ADD COLUMN IF NOT EXISTS posts_importados_em timestamptz;
