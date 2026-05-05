-- ============================================================
-- Cronograma Inteligente de Postagens — adicionado em 2026-05-05
-- ============================================================
-- Hub de feature: user recebe 7 dias de posts prontos toda segunda
-- Tema + script + horário ideal + sugestão de local. IA gera.
-- "Acorde sabendo o que criar".

CREATE TABLE IF NOT EXISTS public.cronograma_semanal (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  semana_inicio   date NOT NULL,                          -- segunda-feira
  semana_fim      date NOT NULL,                          -- domingo seguinte
  gerado_em       timestamptz DEFAULT now(),
  gerado_por      text DEFAULT 'cron',                    -- 'cron' | 'on_demand' | 'regenerar'
  tokens_input    integer DEFAULT 0,
  tokens_output   integer DEFAULT 0,
  custo_centavos  integer DEFAULT 0,                      -- pra dashboard interno de margem
  versao          integer DEFAULT 1,                      -- incrementa ao regerar
  raciocinio      text,                                   -- explicação da IA da sequência narrativa
  CONSTRAINT cronograma_user_semana_unique UNIQUE (user_id, semana_inicio)
);

ALTER TABLE public.cronograma_semanal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users veem só seu cronograma"
  ON public.cronograma_semanal FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insertam só seu cronograma"
  ON public.cronograma_semanal FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cronograma_user_semana
  ON public.cronograma_semanal (user_id, semana_inicio DESC);

-- Estende calendar_items pra suportar items gerados pela IA
ALTER TABLE public.calendar_items
  ADD COLUMN IF NOT EXISTS cronograma_id    uuid REFERENCES public.cronograma_semanal(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS script           text,
  ADD COLUMN IF NOT EXISTS horario_sugerido time,
  ADD COLUMN IF NOT EXISTS local_sugerido   text,
  ADD COLUMN IF NOT EXISTS gancho           text,
  ADD COLUMN IF NOT EXISTS cta              text,
  ADD COLUMN IF NOT EXISTS gerado_por_ia    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS editado_pelo_user boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ics_uid          text;

CREATE INDEX IF NOT EXISTS idx_calendar_items_cronograma
  ON public.calendar_items (cronograma_id);

CREATE INDEX IF NOT EXISTS idx_calendar_items_data_user
  ON public.calendar_items (user_id, data_planejada);
