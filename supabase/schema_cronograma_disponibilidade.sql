-- ============================================================
-- Disponibilidade do criador — adicionado em 2026-05-05
-- ============================================================
-- Sem isso a IA propunha horarios que o user nao podia cumprir
-- (ex: "post 18h" mas user trabalha CLT até 19h). Fluxo: user
-- preenche disponibilidade UMA VEZ antes de gerar primeiro cronograma.

ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS disponibilidade_dias text[],            -- ex: ['seg','ter','qua','qui','sex']
  ADD COLUMN IF NOT EXISTS disponibilidade_periodos text[],        -- ex: ['manha_cedo','almoco','noite']
  ADD COLUMN IF NOT EXISTS disponibilidade_minutos integer,        -- 15/30/60/90 min/dia disponiveis
  ADD COLUMN IF NOT EXISTS disponibilidade_compromissos text,      -- texto livre: "consultas terça e quinta tarde"
  ADD COLUMN IF NOT EXISTS disponibilidade_atualizada_em timestamptz;

-- Mesma coisa pra brand_profiles (caso marca queira cronograma futuro)
ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS disponibilidade_dias text[],
  ADD COLUMN IF NOT EXISTS disponibilidade_periodos text[],
  ADD COLUMN IF NOT EXISTS disponibilidade_minutos integer,
  ADD COLUMN IF NOT EXISTS disponibilidade_compromissos text,
  ADD COLUMN IF NOT EXISTS disponibilidade_atualizada_em timestamptz;
