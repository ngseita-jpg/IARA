-- Novos campos para o questionário de persona do criador
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS sub_nicho TEXT,
  ADD COLUMN IF NOT EXISTS estagio TEXT,
  ADD COLUMN IF NOT EXISTS historia TEXT,
  ADD COLUMN IF NOT EXISTS audiencia TEXT,
  ADD COLUMN IF NOT EXISTS faixa_etaria TEXT,
  ADD COLUMN IF NOT EXISTS problema_resolvido TEXT,
  ADD COLUMN IF NOT EXISTS publico_real TEXT,
  ADD COLUMN IF NOT EXISTS formatos TEXT[],
  ADD COLUMN IF NOT EXISTS frequencia TEXT,
  ADD COLUMN IF NOT EXISTS conteudo_marcante TEXT,
  ADD COLUMN IF NOT EXISTS diferencial TEXT,
  ADD COLUMN IF NOT EXISTS inspiracoes TEXT,
  ADD COLUMN IF NOT EXISTS desafio_principal TEXT,
  ADD COLUMN IF NOT EXISTS meta_12_meses TEXT,
  ADD COLUMN IF NOT EXISTS proposito TEXT;
