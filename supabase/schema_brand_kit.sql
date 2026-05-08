-- ============================================================
-- Brand Kit — identidade visual do criador (2026-05-07)
-- ============================================================
-- Foundation pro Post do Dia + qualquer geração visual futura.
-- User sobe 2-3 prints de carrosseis dele que bombaram (ou que admira),
-- IA Vision extrai paleta + fontes + mood + estilo. Tudo cacheado aqui
-- pra cada geração ja nascer alinhada com identidade.
--
-- Por user existe 1 brand kit ativo (atualizavel). Historico fica em
-- versao_anterior pra rollback se gerar algo pior.

CREATE TABLE IF NOT EXISTS public.brand_kits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Referencias visuais (URLs de imagens uploadadas pelo user)
  -- Limite 5 prints. Storage no Supabase bucket 'brand-references'
  referencias_urls text[] DEFAULT '{}',

  -- Output extraido pela IA Vision
  paleta_principal jsonb DEFAULT '[]'::jsonb,        -- [{nome:'iara-blue',hex:'#6366f1',uso:'titulos'},...] 5 cores max
  fonte_titulo     text,                              -- ex: 'Inter Black' | 'Playfair Display'
  fonte_corpo      text,                              -- ex: 'Inter Regular'
  mood_visual      text,                              -- 'minimalista' | 'maximalista' | 'sereno' | 'energetico' | 'editorial' | 'pop'
  estilo_imagens   text,                              -- 'fotos limpas' | 'flat illustrations' | 'aquarela' | 'gradient overlays' | 'fotos cruas'
  elementos_recorrentes text[],                       -- ['ícones outline','formas geometricas','fotos pessoais']

  -- Resumo IA pra usar como prompt em outras rotas
  prompt_visual_compacto text,                        -- 1-2 frases denso pra injetar em prompts de carrossel/thumbnail/post
  raciocinio_ia    text,                              -- explicacao da extracao pra transparencia

  -- Versionamento simples (snapshot do anterior em caso de regerar)
  versao_anterior  jsonb,

  -- Custo
  tokens_input    integer,
  tokens_output   integer,
  custo_centavos  integer,

  -- Timestamps
  criado_em       timestamptz DEFAULT now(),
  atualizado_em   timestamptz DEFAULT now(),

  CONSTRAINT brand_kit_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_brand_kits_user ON public.brand_kits (user_id);

ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users veem só seu brand kit"
  ON public.brand_kits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger atualizado_em
CREATE OR REPLACE FUNCTION public.brand_kit_atualizar_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS brand_kit_set_atualizado_em ON public.brand_kits;
CREATE TRIGGER brand_kit_set_atualizado_em
  BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW EXECUTE FUNCTION public.brand_kit_atualizar_timestamp();

-- Storage bucket pras referencias visuais (criar manualmente no painel
-- ou via supabase CLI: supabase storage create brand-references --public)
-- Policy: user lê só dele, mas leitura publica pra ser usada em <img> src
