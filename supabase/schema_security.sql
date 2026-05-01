-- ============================================================================
-- HARDENING DE SEGURANÇA — rate_limits + api_audit_log
-- Rodar no SQL Editor do Supabase. Idempotente.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- rate_limits: contador por chave + janela deslizante
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  hits INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON rate_limits(window_start);

-- Função atômica: incrementa contador, reseta janela quando expira.
-- Retorna se está OK (abaixo do limite) e quanto sobra.
CREATE OR REPLACE FUNCTION rate_limit_check(
  p_key TEXT,
  p_max INT,
  p_window_sec INT
) RETURNS TABLE (ok BOOLEAN, remaining INT) AS $$
DECLARE
  v_hits INT;
BEGIN
  INSERT INTO rate_limits (key, hits, window_start)
  VALUES (p_key, 1, NOW())
  ON CONFLICT (key) DO UPDATE
    SET
      hits = CASE
        WHEN rate_limits.window_start < NOW() - (p_window_sec || ' seconds')::INTERVAL THEN 1
        ELSE rate_limits.hits + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start < NOW() - (p_window_sec || ' seconds')::INTERVAL THEN NOW()
        ELSE rate_limits.window_start
      END
  RETURNING hits INTO v_hits;

  RETURN QUERY SELECT (v_hits <= p_max) AS ok, GREATEST(0, p_max - v_hits) AS remaining;
END;
$$ LANGUAGE plpgsql;

-- RLS: ninguém acessa direto (só via service role)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Limpeza opcional (cron pode chamar): remove keys com janela > 24h
CREATE OR REPLACE FUNCTION rate_limits_cleanup() RETURNS INT AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- api_audit_log: trilha de eventos sensíveis (signup, checkout, deletar conta)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  evento TEXT NOT NULL,         -- ex: 'signup', 'checkout_iniciado', 'conta_deletada'
  ip TEXT,
  user_agent TEXT,
  rota TEXT,
  status_http INT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_audit_log_user_id_idx ON api_audit_log(user_id);
CREATE INDEX IF NOT EXISTS api_audit_log_evento_idx ON api_audit_log(evento);
CREATE INDEX IF NOT EXISTS api_audit_log_created_at_idx ON api_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS api_audit_log_ip_idx ON api_audit_log(ip);

ALTER TABLE api_audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas service role grava/lê (insere via admin client; leitura via dashboard admin)
-- Não criamos policies de SELECT pra usuário comum — admin lê via SUPABASE_SERVICE_ROLE_KEY

-- Limpeza: remove logs > 90 dias (LGPD-friendly)
CREATE OR REPLACE FUNCTION api_audit_log_cleanup() RETURNS INT AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM api_audit_log WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;
