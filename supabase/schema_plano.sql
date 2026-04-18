-- Adiciona coluna plano ao creator_profiles
-- Rode no Supabase SQL Editor

ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS plano text DEFAULT 'free'
    CHECK (plano IN ('free', 'plus', 'premium', 'profissional'));

-- Para setar seu próprio plano como profissional (sem limites),
-- substitua <SEU_USER_ID> pelo ID da sua conta no Supabase Auth:
-- UPDATE creator_profiles SET plano = 'profissional' WHERE user_id = '<SEU_USER_ID>';
