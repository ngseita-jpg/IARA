-- ============================================================
-- Post do Dia — Fase B (manual) — 2026-05-08
-- ============================================================
-- Carrossel pronto gerado sob demanda (botão na UI). Usa Brand Kit
-- + persona + tema do dia pra produzir slides com imagens FAL.ai.
--
-- Fase C (próxima) vai materializar via cron 6h pra cada user Premium
-- com push notification. Schema já preparado pra isso.

CREATE TABLE IF NOT EXISTS public.manha_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 1 post por user/dia (evita gerar 2x no mesmo dia, garante limite)
  data            date NOT NULL DEFAULT CURRENT_DATE,

  -- Conteúdo gerado
  tema            text,                            -- assunto principal
  slides_json     jsonb DEFAULT '[]'::jsonb,       -- [{titulo,texto,descricao_imagem,imagem_url}]
  legenda         text,                            -- caption pro Instagram
  hashtags        text[],                          -- 5-10 hashtags relevantes

  -- Origem
  origem          text DEFAULT 'manual',           -- 'manual' | 'cron' (Fase C)
  cronograma_item_id uuid,                         -- se veio de item do cronograma

  -- Status do pipeline (gerar texto -> gerar imagens -> done)
  status          text DEFAULT 'gerando',          -- 'gerando' | 'pronto' | 'falhou'
  erro            text,

  -- Custo / telemetria
  tokens_input    integer,
  tokens_output   integer,
  imagens_geradas integer DEFAULT 0,
  custo_centavos  integer,

  -- Timestamps
  criado_em       timestamptz DEFAULT now(),
  atualizado_em   timestamptz DEFAULT now(),

  CONSTRAINT manha_post_user_dia_unique UNIQUE (user_id, data)
);

CREATE INDEX IF NOT EXISTS idx_manha_posts_user_data ON public.manha_posts (user_id, data DESC);

ALTER TABLE public.manha_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users veem só seus posts do dia"
  ON public.manha_posts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.manha_post_atualizar_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS manha_post_set_atualizado_em ON public.manha_posts;
CREATE TRIGGER manha_post_set_atualizado_em
  BEFORE UPDATE ON public.manha_posts
  FOR EACH ROW EXECUTE FUNCTION public.manha_post_atualizar_timestamp();
