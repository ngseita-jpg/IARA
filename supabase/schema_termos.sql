-- ============================================================
-- Termos de Uso versionados — adicionado em 2026-05-04
-- ============================================================
-- Coluna pra registrar qual versao dos termos o user aceitou + quando.
-- Usuarios EXISTENTES (criados antes da nova versao) sao marcados como
-- versao legada '2026-04-01' — sao de confianca pre-launch e nao precisam
-- re-aceitar. Apenas NOVOS cadastros sao forcados a aceitar a versao atual.

ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS termos_versao_aceita text DEFAULT NULL;

ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS termos_aceitos_at timestamptz DEFAULT NULL;

-- Mesma coisa pra brand_profiles
ALTER TABLE brand_profiles
  ADD COLUMN IF NOT EXISTS termos_versao_aceita text DEFAULT NULL;

ALTER TABLE brand_profiles
  ADD COLUMN IF NOT EXISTS termos_aceitos_at timestamptz DEFAULT NULL;

-- Marca todos os usuarios EXISTENTES como aceitos na versao legada.
-- Isso garante que nao serao bloqueados ao logar pela proxima vez.
UPDATE creator_profiles
SET termos_versao_aceita = '2026-04-01',
    termos_aceitos_at = COALESCE(created_at, now())
WHERE termos_versao_aceita IS NULL;

UPDATE brand_profiles
SET termos_versao_aceita = '2026-04-01',
    termos_aceitos_at = COALESCE(created_at, now())
WHERE termos_versao_aceita IS NULL;

-- Index pra queries do admin (listar quem aceitou qual versao)
CREATE INDEX IF NOT EXISTS idx_creator_profiles_termos_versao
  ON creator_profiles (termos_versao_aceita);
