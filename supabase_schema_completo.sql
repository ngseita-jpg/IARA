-- =============================================================
-- IARA HUB — Schema Completo para Supabase
-- Seguro para rodar mesmo que tabelas já existam (idempotente)
-- Execute no SQL Editor do Supabase
-- =============================================================

-- Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- FUNÇÃO updated_at (usada por triggers)
-- =============================================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 1. CREATOR PROFILES
-- =============================================================
CREATE TABLE IF NOT EXISTS creator_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_artistico      TEXT,
  nicho               TEXT,
  sub_nicho           TEXT,
  estagio             TEXT,
  historia            TEXT,
  audiencia           TEXT,
  faixa_etaria        TEXT,
  problema_resolvido  TEXT,
  publico_real        TEXT,
  tom_de_voz          TEXT,
  plataformas         TEXT[] DEFAULT '{}',
  formatos            TEXT[] DEFAULT '{}',
  frequencia          TEXT,
  conteudo_marcante   TEXT,
  diferencial         TEXT,
  inspiracoes         TEXT,
  objetivo            TEXT,
  desafio_principal   TEXT,
  meta_12_meses       TEXT,
  proposito           TEXT,
  video_referencias   JSONB DEFAULT '[]',
  sobre               TEXT,
  pontos              INT DEFAULT 0,
  nivel               INT DEFAULT 0,
  treinos_voz         INT DEFAULT 0,
  voz_perfil          TEXT,
  voz_score_medio     INT DEFAULT 0,
  plano               TEXT DEFAULT 'free' CHECK (plano IN ('free','plus','premium','profissional')),
  onboarding_completo BOOLEAN DEFAULT false,
  updated_at          TIMESTAMPTZ DEFAULT now(),
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS sub_nicho TEXT;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS video_referencias JSONB DEFAULT '[]';
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS voz_perfil TEXT;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS voz_score_medio INT DEFAULT 0;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS treinos_voz INT DEFAULT 0;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS nivel INT DEFAULT 0;

DROP TRIGGER IF EXISTS set_updated_at_creator_profiles ON creator_profiles;
CREATE TRIGGER set_updated_at_creator_profiles
  BEFORE UPDATE ON creator_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "creator_profiles_select_own" ON creator_profiles;
CREATE POLICY "creator_profiles_select_own" ON creator_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "creator_profiles_insert_own" ON creator_profiles;
CREATE POLICY "creator_profiles_insert_own" ON creator_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "creator_profiles_update_own" ON creator_profiles;
CREATE POLICY "creator_profiles_update_own" ON creator_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Marcas podem ver perfis de criadores (para marketplace)
DROP POLICY IF EXISTS "creator_profiles_select_brand" ON creator_profiles;
CREATE POLICY "creator_profiles_select_brand" ON creator_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM brand_profiles WHERE user_id = auth.uid())
  );

-- =============================================================
-- 2. VOICE ANALYSES
-- =============================================================
CREATE TABLE IF NOT EXISTS voice_analyses (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transcript          TEXT,
  duracao_segundos    INT DEFAULT 0,
  palavras_por_minuto INT DEFAULT 0,
  score_confianca     INT DEFAULT 0,
  score_energia       INT DEFAULT 0,
  score_fluidez       INT DEFAULT 0,
  score_emocao        INT DEFAULT 0,
  score_clareza       INT DEFAULT 0,
  score_total         INT DEFAULT 0,
  feedback            TEXT,
  exercicios          TEXT[] DEFAULT '{}',
  perfil_voz          TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE voice_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "voice_analyses_select_own" ON voice_analyses;
CREATE POLICY "voice_analyses_select_own" ON voice_analyses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "voice_analyses_insert_own" ON voice_analyses;
CREATE POLICY "voice_analyses_insert_own" ON voice_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================
-- 3. METAS
-- =============================================================
CREATE TABLE IF NOT EXISTS metas (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo            TEXT NOT NULL,
  descricao         TEXT,
  plataforma        TEXT,
  meta_tipo         TEXT DEFAULT 'postagens',
  quantidade_meta   INT DEFAULT 1,
  quantidade_atual  INT DEFAULT 0,
  data_limite       DATE,
  pontos_recompensa INT DEFAULT 25,
  status            TEXT DEFAULT 'ativa' CHECK (status IN ('ativa','concluida')),
  concluida_em      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "metas_all_own" ON metas;
CREATE POLICY "metas_all_own" ON metas
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================
-- 4. CALENDAR ITEMS
-- =============================================================
CREATE TABLE IF NOT EXISTS calendar_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meta_id         UUID REFERENCES metas(id) ON DELETE SET NULL,
  titulo          TEXT NOT NULL,
  plataforma      TEXT,
  tipo_conteudo   TEXT DEFAULT 'post' CHECK (tipo_conteudo IN ('post','reel','story','live','video','carrossel')),
  data_planejada  DATE NOT NULL,
  concluido       BOOLEAN DEFAULT false,
  concluido_em    TIMESTAMPTZ,
  pontos          INT DEFAULT 5,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE calendar_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_items_all_own" ON calendar_items;
CREATE POLICY "calendar_items_all_own" ON calendar_items
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================
-- 5. BRAND PROFILES
-- =============================================================
CREATE TABLE IF NOT EXISTS brand_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_empresa        TEXT,
  cnpj                TEXT,
  segmento            TEXT,
  porte               TEXT CHECK (porte IN ('startup','pequena','media','grande','agencia')),
  site                TEXT,
  instagram           TEXT,
  sobre               TEXT,
  orcamento_medio     TEXT CHECK (orcamento_medio IN ('ate_5k','5k_20k','20k_50k','50k_mais')),
  nichos_interesse    TEXT[] DEFAULT '{}',
  plataformas_foco    TEXT[] DEFAULT '{}',
  plano               TEXT DEFAULT 'free',
  onboarding_completo BOOLEAN DEFAULT false,
  updated_at          TIMESTAMPTZ DEFAULT now(),
  created_at          TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS set_updated_at_brand_profiles ON brand_profiles;
CREATE TRIGGER set_updated_at_brand_profiles
  BEFORE UPDATE ON brand_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brand_profiles_all_own" ON brand_profiles;
CREATE POLICY "brand_profiles_all_own" ON brand_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Criadores podem ver perfil de marcas (para candidaturas)
DROP POLICY IF EXISTS "brand_profiles_select_creator" ON brand_profiles;
CREATE POLICY "brand_profiles_select_creator" ON brand_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM creator_profiles WHERE user_id = auth.uid())
  );

-- =============================================================
-- 6. VAGAS
-- =============================================================
CREATE TABLE IF NOT EXISTS vagas (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id         UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  nome_empresa     TEXT,
  titulo           TEXT NOT NULL,
  descricao        TEXT,
  segmento         TEXT,
  tipo             TEXT DEFAULT 'pago' CHECK (tipo IN ('pago','recebido')),
  valor            NUMERIC(10,2),
  entregaveis      TEXT[] DEFAULT '{}',
  plataformas      TEXT[] DEFAULT '{}',
  nichos           TEXT[] DEFAULT '{}',
  min_seguidores   INT DEFAULT 0,
  prazo_inscricao  DATE,
  prazo_entrega    DATE,
  status           TEXT DEFAULT 'aberta' CHECK (status IN ('aberta','encerrada','pausada')),
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vagas ENABLE ROW LEVEL SECURITY;

-- Marcas gerenciam suas vagas
DROP POLICY IF EXISTS "vagas_all_brand" ON vagas;
CREATE POLICY "vagas_all_brand" ON vagas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM brand_profiles WHERE id = brand_id AND user_id = auth.uid())
  );

-- Criadores veem vagas abertas
DROP POLICY IF EXISTS "vagas_select_creator" ON vagas;
CREATE POLICY "vagas_select_creator" ON vagas
  FOR SELECT USING (status = 'aberta');

-- =============================================================
-- 7. CANDIDATURAS
-- =============================================================
CREATE TABLE IF NOT EXISTS candidaturas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vaga_id     UUID NOT NULL REFERENCES vagas(id) ON DELETE CASCADE,
  creator_id  UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  mensagem    TEXT,
  status      TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','aprovada','recusada')),
  score_match INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (vaga_id, creator_id)
);

ALTER TABLE candidaturas ENABLE ROW LEVEL SECURITY;

-- Criadores gerenciam suas candidaturas
DROP POLICY IF EXISTS "candidaturas_all_creator" ON candidaturas;
CREATE POLICY "candidaturas_all_creator" ON candidaturas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM creator_profiles WHERE id = creator_id AND user_id = auth.uid())
  );

-- Marcas veem candidaturas das suas vagas
DROP POLICY IF EXISTS "candidaturas_select_brand" ON candidaturas;
CREATE POLICY "candidaturas_select_brand" ON candidaturas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vagas v
      JOIN brand_profiles bp ON bp.id = v.brand_id
      WHERE v.id = vaga_id AND bp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "candidaturas_update_brand" ON candidaturas;
CREATE POLICY "candidaturas_update_brand" ON candidaturas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM vagas v
      JOIN brand_profiles bp ON bp.id = v.brand_id
      WHERE v.id = vaga_id AND bp.user_id = auth.uid()
    )
  );

-- =============================================================
-- 8. CONVERSAS
-- =============================================================
CREATE TABLE IF NOT EXISTS conversas (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidatura_id   UUID UNIQUE NOT NULL REFERENCES candidaturas(id) ON DELETE CASCADE,
  brand_user_id    UUID NOT NULL REFERENCES auth.users(id),
  creator_user_id  UUID NOT NULL REFERENCES auth.users(id),
  status           TEXT DEFAULT 'aberta' CHECK (status IN ('aberta','proposta_enviada','fechado','cancelado')),
  valor_acordado   NUMERIC(10,2),
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversas_all_participant" ON conversas;
CREATE POLICY "conversas_all_participant" ON conversas
  FOR ALL USING (auth.uid() = brand_user_id OR auth.uid() = creator_user_id);

-- =============================================================
-- 9. MENSAGENS
-- =============================================================
CREATE TABLE IF NOT EXISTS mensagens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversa_id     UUID NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES auth.users(id),
  conteudo        TEXT NOT NULL,
  tipo            TEXT DEFAULT 'texto' CHECK (tipo IN ('texto','proposta','aceite','recusa')),
  proposta_valor  NUMERIC(10,2),
  lida            BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mensagens_conversa_idx ON mensagens(conversa_id, created_at);

ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mensagens_select_participant" ON mensagens;
CREATE POLICY "mensagens_select_participant" ON mensagens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversas
      WHERE id = conversa_id
        AND (brand_user_id = auth.uid() OR creator_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "mensagens_insert_participant" ON mensagens;
CREATE POLICY "mensagens_insert_participant" ON mensagens
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversas
      WHERE id = conversa_id
        AND (brand_user_id = auth.uid() OR creator_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "mensagens_update_participant" ON mensagens;
CREATE POLICY "mensagens_update_participant" ON mensagens
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversas
      WHERE id = conversa_id
        AND (brand_user_id = auth.uid() OR creator_user_id = auth.uid())
    )
  );

-- =============================================================
-- 10. CRIADORES SALVOS
-- =============================================================
CREATE TABLE IF NOT EXISTS criadores_salvos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  creator_id  UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  nota        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (brand_id, creator_id)
);

ALTER TABLE criadores_salvos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "criadores_salvos_all_brand" ON criadores_salvos;
CREATE POLICY "criadores_salvos_all_brand" ON criadores_salvos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM brand_profiles WHERE id = brand_id AND user_id = auth.uid())
  );

-- =============================================================
-- 11. METRICAS_REDES
-- =============================================================
CREATE TABLE IF NOT EXISTS metricas_redes (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plataforma              TEXT NOT NULL CHECK (plataforma IN ('instagram','youtube','tiktok','linkedin','twitter')),
  seguidores              INT DEFAULT 0,
  alcance_mensal          INT DEFAULT 0,
  impressoes_mensais      INT DEFAULT 0,
  curtidas_mensais        INT DEFAULT 0,
  comentarios_mensais     INT DEFAULT 0,
  compartilhamentos_mensais INT DEFAULT 0,
  salvamentos_mensais     INT DEFAULT 0,
  visualizacoes_mensais   INT DEFAULT 0,
  posts_mensais           INT DEFAULT 0,
  taxa_engajamento        NUMERIC(5,2) DEFAULT 0,
  updated_at              TIMESTAMPTZ DEFAULT now(),
  created_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, plataforma)
);

DROP TRIGGER IF EXISTS set_updated_at_metricas_redes ON metricas_redes;
CREATE TRIGGER set_updated_at_metricas_redes
  BEFORE UPDATE ON metricas_redes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE metricas_redes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "metricas_redes_all_own" ON metricas_redes;
CREATE POLICY "metricas_redes_all_own" ON metricas_redes
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================
-- 12. ANALISES_METRICAS
-- =============================================================
CREATE TABLE IF NOT EXISTS analises_metricas (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analise    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE analises_metricas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analises_metricas_all_own" ON analises_metricas;
CREATE POLICY "analises_metricas_all_own" ON analises_metricas
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================
-- 13. CONTENT HISTORY
-- =============================================================
CREATE TABLE IF NOT EXISTS content_history (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL CHECK (tipo IN (
    'roteiro','carrossel','stories','thumbnail','temas','midia_kit','oratorio','fotos'
  )),
  titulo     TEXT NOT NULL,
  parametros JSONB DEFAULT '{}',
  conteudo   JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_history_user_tipo_idx
  ON content_history(user_id, tipo, created_at DESC);

ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_history_all_own" ON content_history;
CREATE POLICY "content_history_all_own" ON content_history
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================
-- 14. USER_PHOTOS
-- =============================================================
CREATE TABLE IF NOT EXISTS user_photos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  nome         TEXT,
  tamanho_kb   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_photos_user_idx ON user_photos(user_id, created_at DESC);

ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_photos_all_own" ON user_photos;
CREATE POLICY "user_photos_all_own" ON user_photos
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================
-- 15. SOCIAL_CONNECTIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS social_connections (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform          TEXT NOT NULL CHECK (platform IN ('youtube','instagram','tiktok','linkedin')),
  access_token      TEXT NOT NULL,
  refresh_token     TEXT,
  token_expires_at  TIMESTAMPTZ,
  platform_user_id  TEXT,
  platform_username TEXT,
  connected_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, platform)
);

ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "social_connections_all_own" ON social_connections;
CREATE POLICY "social_connections_all_own" ON social_connections
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================
-- 16. PRODUTOS_AFILIADOS
-- =============================================================
CREATE TABLE IF NOT EXISTS produtos_afiliados (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id             UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  titulo               TEXT NOT NULL,
  descricao            TEXT,
  url_produto          TEXT NOT NULL,
  preco                NUMERIC(10,2),
  imagem_url           TEXT,
  comissao_pct         NUMERIC(5,2) DEFAULT 10,
  desconto_pct         NUMERIC(5,2) DEFAULT 10,
  webhook_secret       TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),
  webhook_confirmado   BOOLEAN DEFAULT false,
  ativo                BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE produtos_afiliados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "produtos_afiliados_all_brand" ON produtos_afiliados;
CREATE POLICY "produtos_afiliados_all_brand" ON produtos_afiliados
  FOR ALL USING (
    EXISTS (SELECT 1 FROM brand_profiles WHERE id = brand_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "produtos_afiliados_select_creator" ON produtos_afiliados;
CREATE POLICY "produtos_afiliados_select_creator" ON produtos_afiliados
  FOR SELECT USING (ativo = true);

-- =============================================================
-- 17. AFILIADOS
-- =============================================================
CREATE TABLE IF NOT EXISTS afiliados (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id          UUID NOT NULL REFERENCES produtos_afiliados(id) ON DELETE CASCADE,
  creator_id          UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  cupom_codigo        TEXT UNIQUE NOT NULL,
  status              TEXT DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  cliques             INT DEFAULT 0,
  vendas_confirmadas  INT DEFAULT 0,
  comissao_total      NUMERIC(10,2) DEFAULT 0,
  suspeito            BOOLEAN DEFAULT false,
  suspeito_em         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (produto_id, creator_id)
);

ALTER TABLE afiliados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "afiliados_all_creator" ON afiliados;
CREATE POLICY "afiliados_all_creator" ON afiliados
  FOR ALL USING (
    EXISTS (SELECT 1 FROM creator_profiles WHERE id = creator_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "afiliados_select_brand" ON afiliados;
CREATE POLICY "afiliados_select_brand" ON afiliados
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM produtos_afiliados pa
      JOIN brand_profiles bp ON bp.id = pa.brand_id
      WHERE pa.id = produto_id AND bp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "afiliados_update_brand" ON afiliados;
CREATE POLICY "afiliados_update_brand" ON afiliados
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM produtos_afiliados pa
      JOIN brand_profiles bp ON bp.id = pa.brand_id
      WHERE pa.id = produto_id AND bp.user_id = auth.uid()
    )
  );

-- =============================================================
-- 18. VENDAS_AFILIADO
-- =============================================================
CREATE TABLE IF NOT EXISTS vendas_afiliado (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  afiliado_id      UUID NOT NULL REFERENCES afiliados(id) ON DELETE CASCADE,
  valor_venda      NUMERIC(10,2) NOT NULL,
  comissao_criador NUMERIC(10,2) NOT NULL,
  comissao_iara    NUMERIC(10,2) NOT NULL,
  observacoes      TEXT,
  origem           TEXT DEFAULT 'manual' CHECK (origem IN ('manual','webhook')),
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vendas_afiliado ENABLE ROW LEVEL SECURITY;

-- Marcas registram vendas
DROP POLICY IF EXISTS "vendas_afiliado_insert_brand" ON vendas_afiliado;
CREATE POLICY "vendas_afiliado_insert_brand" ON vendas_afiliado
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM afiliados a
      JOIN produtos_afiliados pa ON pa.id = a.produto_id
      JOIN brand_profiles bp ON bp.id = pa.brand_id
      WHERE a.id = afiliado_id AND bp.user_id = auth.uid()
    )
  );

-- Criadores veem suas vendas
DROP POLICY IF EXISTS "vendas_afiliado_select_creator" ON vendas_afiliado;
CREATE POLICY "vendas_afiliado_select_creator" ON vendas_afiliado
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM afiliados a
      JOIN creator_profiles cp ON cp.id = a.creator_id
      WHERE a.id = afiliado_id AND cp.user_id = auth.uid()
    )
  );

-- Marcas veem vendas dos seus produtos
DROP POLICY IF EXISTS "vendas_afiliado_select_brand" ON vendas_afiliado;
CREATE POLICY "vendas_afiliado_select_brand" ON vendas_afiliado
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM afiliados a
      JOIN produtos_afiliados pa ON pa.id = a.produto_id
      JOIN brand_profiles bp ON bp.id = pa.brand_id
      WHERE a.id = afiliado_id AND bp.user_id = auth.uid()
    )
  );

-- =============================================================
-- STORAGE BUCKET — fotos-usuario
-- =============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fotos-usuario',
  'fotos-usuario',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
DROP POLICY IF EXISTS "fotos_upload_own" ON storage.objects;
CREATE POLICY "fotos_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'fotos-usuario' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "fotos_select_own" ON storage.objects;
CREATE POLICY "fotos_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'fotos-usuario' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "fotos_delete_own" ON storage.objects;
CREATE POLICY "fotos_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'fotos-usuario' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================================
-- ÍNDICES EXTRAS DE PERFORMANCE
-- =============================================================
CREATE INDEX IF NOT EXISTS creator_profiles_user_id_idx ON creator_profiles(user_id);
CREATE INDEX IF NOT EXISTS brand_profiles_user_id_idx ON brand_profiles(user_id);
CREATE INDEX IF NOT EXISTS vagas_brand_status_idx ON vagas(brand_id, status);
CREATE INDEX IF NOT EXISTS candidaturas_creator_idx ON candidaturas(creator_id);
CREATE INDEX IF NOT EXISTS candidaturas_vaga_idx ON candidaturas(vaga_id);
CREATE INDEX IF NOT EXISTS mensagens_lida_idx ON mensagens(conversa_id, lida);
CREATE INDEX IF NOT EXISTS afiliados_cupom_idx ON afiliados(cupom_codigo);
CREATE INDEX IF NOT EXISTS afiliados_creator_idx ON afiliados(creator_id);

-- =============================================================
-- FIM DO SCRIPT
-- Após rodar, verifique no Table Editor que todas as tabelas
-- aparecem com as colunas corretas e RLS ativado (ícone de cadeado)
-- =============================================================
1