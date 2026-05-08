-- ============================================================
-- Bússola — Planejamento de Carreira (2026-05-07)
-- ============================================================
-- Substitui "Metas" como direcionamento estratégico.
-- Outras areas (cronograma, roteiros, etc) leem dessa tabela pra
-- alinhar conteudo gerado com o marco de 3 meses do criador.
--
-- Estrutura:
-- - 1 plano ativo por user (trimestre corrente)
-- - planos antigos persistem com status 'arquivado' pra historico
-- - campos JSON pra flexibilidade durante validacao da feature

CREATE TABLE IF NOT EXISTS public.bussola_planos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status          text NOT NULL DEFAULT 'ativo',         -- 'ativo' | 'arquivado'
  trimestre       text,                                   -- ex: '2026-Q2'
  -- Camada 1: Identidade (puxa de creator_profiles, mas pode customizar aqui)
  diferencial     text,                                   -- "o que TÉCNICO/HUMANO te separa"
  audiencia_alvo  text,                                   -- "pra quem você fala"
  -- Camada 2: Visão
  marco_3m        text,                                   -- "5k followers" | "lançar isca"
  marco_1a        text,                                   -- "50k seguidores + R$10k/mês"
  marco_3a        text,                                   -- "full-time como criador"
  fase_atual      text NOT NULL DEFAULT 'construindo',   -- 'construindo' | 'crescendo' | 'monetizando' | 'escalando'
  -- Camada 4: Missoes (gerados pela IA, editaveis)
  -- jsonb array: [{ semana: 1, missoes: [{texto, concluida, criada_em}] }, ...]
  missoes         jsonb DEFAULT '[]'::jsonb,
  -- IA raciocinio pra debug + transparencia
  raciocinio_ia   text,
  -- Custo
  tokens_input    integer,
  tokens_output   integer,
  custo_centavos  integer,
  -- Timestamps
  criado_em       timestamptz DEFAULT now(),
  atualizado_em   timestamptz DEFAULT now(),
  CONSTRAINT bussola_status_check CHECK (status IN ('ativo', 'arquivado')),
  CONSTRAINT bussola_fase_check CHECK (fase_atual IN ('construindo', 'crescendo', 'monetizando', 'escalando'))
);

-- Apenas 1 plano ativo por user (trigger garante consistência)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bussola_user_ativo
  ON public.bussola_planos (user_id) WHERE status = 'ativo';

CREATE INDEX IF NOT EXISTS idx_bussola_user_status
  ON public.bussola_planos (user_id, status, criado_em DESC);

ALTER TABLE public.bussola_planos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users veem só seus planos"
  ON public.bussola_planos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger pra atualizar atualizado_em
CREATE OR REPLACE FUNCTION public.bussola_atualizar_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS bussola_set_atualizado_em ON public.bussola_planos;
CREATE TRIGGER bussola_set_atualizado_em
  BEFORE UPDATE ON public.bussola_planos
  FOR EACH ROW EXECUTE FUNCTION public.bussola_atualizar_timestamp();
