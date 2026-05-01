-- ============================================================================
-- WAVE 2 — UX hardening: favoritos, feedback IA, templates, midia kit público
-- Idempotente. Rodar no SQL Editor do Supabase.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. content_history: + favoritado, content_type check expandido
-- ----------------------------------------------------------------------------
ALTER TABLE public.content_history ADD COLUMN IF NOT EXISTS favoritado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.content_history ADD COLUMN IF NOT EXISTS favoritado_em TIMESTAMPTZ;

-- Drop o check antigo que limita 'tipo' (já adicionamos 'persona', 'temas', 'midia_kit' etc)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'content_history' AND constraint_name LIKE '%tipo%check%'
  ) THEN
    ALTER TABLE public.content_history DROP CONSTRAINT IF EXISTS content_history_tipo_check;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS content_history_user_favoritado_idx
  ON public.content_history (user_id, favoritado, created_at DESC)
  WHERE favoritado = true;

-- ----------------------------------------------------------------------------
-- 2. ia_feedback: like/dislike pós-geração (pra IA aprender o que funciona)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ia_feedback (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  modulo TEXT NOT NULL,                              -- roteiro, carrossel, stories, thumbnail, etc
  conteudo_history_id UUID REFERENCES public.content_history(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating IN (-1, 1)), -- -1 dislike, 1 like
  motivo TEXT,                                        -- razão opcional (até 500 chars)
  parametros JSONB DEFAULT '{}'::jsonb,               -- contexto da geração pra análise futura
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, conteudo_history_id)               -- 1 feedback por user por geração
);

CREATE INDEX IF NOT EXISTS ia_feedback_user_idx ON public.ia_feedback(user_id);
CREATE INDEX IF NOT EXISTS ia_feedback_modulo_rating_idx ON public.ia_feedback(modulo, rating);
CREATE INDEX IF NOT EXISTS ia_feedback_created_idx ON public.ia_feedback(created_at DESC);

ALTER TABLE public.ia_feedback ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ia_feedback' AND policyname = 'users own ia_feedback'
  ) THEN
    CREATE POLICY "users own ia_feedback" ON public.ia_feedback
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. content_templates: configurações salvas pra reusar
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  modulo TEXT NOT NULL,                                  -- roteiro, carrossel, etc
  nome TEXT NOT NULL,                                    -- ex: "Reels educativo gastronomia"
  descricao TEXT,
  parametros JSONB NOT NULL DEFAULT '{}'::jsonb,         -- payload pré-configurado
  uso_count INT NOT NULL DEFAULT 0,                      -- quantas vezes foi usado
  ultimo_uso TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_templates_user_modulo_idx
  ON public.content_templates(user_id, modulo, ultimo_uso DESC NULLS LAST);

ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'content_templates' AND policyname = 'users own templates'
  ) THEN
    CREATE POLICY "users own templates" ON public.content_templates
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. creator_profiles: handle público pra link de mídia kit
-- ----------------------------------------------------------------------------
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS handle_publico TEXT;
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS midia_kit_publico BOOLEAN NOT NULL DEFAULT FALSE;

-- Handle único (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS creator_profiles_handle_publico_idx
  ON public.creator_profiles (lower(handle_publico))
  WHERE handle_publico IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 5. Notificação proativa de uso: marker pra não spammar mesmo aviso
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_notif_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  uso_80_avisado_em TIMESTAMPTZ,                        -- avisamos uma vez por mês
  uso_50_avisado_em TIMESTAMPTZ,
  bem_vindo_dica_em TIMESTAMPTZ,
  meta JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_notif_state ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_notif_state' AND policyname = 'users own notif_state'
  ) THEN
    CREATE POLICY "users own notif_state" ON public.user_notif_state
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- FIM DO SCRIPT
-- Após rodar, verificar:
-- - content_history.favoritado existe
-- - ia_feedback, content_templates, user_notif_state criadas com RLS
-- - creator_profiles.handle_publico + midia_kit_publico existem
-- ============================================================================
