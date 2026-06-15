-- Migration: ai_reliability tables (Module 12.1)

CREATE TABLE IF NOT EXISTS ai_traces (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           TEXT        NOT NULL,
  fingerprint      TEXT        NOT NULL,
  task_type        TEXT        NOT NULL,
  started_at       TIMESTAMPTZ NOT NULL,
  finished_at      TIMESTAMPTZ,
  duration_ms      INT,
  status           TEXT        NOT NULL CHECK (status IN ('running','completed','failed')),
  failure_category TEXT,
  token_estimate   INT,
  cost_estimate    NUMERIC(12,8),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_dlq (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint      TEXT        NOT NULL UNIQUE,
  job_id           TEXT        NOT NULL,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type        TEXT        NOT NULL,
  failure_category TEXT        NOT NULL,
  error_message    TEXT        NOT NULL,
  retry_count      INT         NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_budgets (
  user_id               UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_budget_usd      NUMERIC(10,6) NOT NULL DEFAULT 1.00,
  monthly_budget_usd    NUMERIC(10,6) NOT NULL DEFAULT 20.00,
  daily_token_limit     INT          NOT NULL DEFAULT 100000,
  monthly_token_limit   INT          NOT NULL DEFAULT 2000000,
  daily_usage_usd       NUMERIC(10,6) NOT NULL DEFAULT 0,
  monthly_usage_usd     NUMERIC(10,6) NOT NULL DEFAULT 0,
  daily_tokens_used     INT          NOT NULL DEFAULT 0,
  monthly_tokens_used   INT          NOT NULL DEFAULT 0,
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Atomic budget increment (avoids race conditions)
CREATE OR REPLACE FUNCTION increment_ai_budget_usage(
  p_user_id  UUID,
  p_cost_usd NUMERIC,
  p_tokens   INT
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO ai_budgets (user_id, daily_usage_usd, monthly_usage_usd, daily_tokens_used, monthly_tokens_used)
  VALUES (p_user_id, p_cost_usd, p_cost_usd, p_tokens, p_tokens)
  ON CONFLICT (user_id) DO UPDATE SET
    daily_usage_usd     = ai_budgets.daily_usage_usd     + p_cost_usd,
    monthly_usage_usd   = ai_budgets.monthly_usage_usd   + p_cost_usd,
    daily_tokens_used   = ai_budgets.daily_tokens_used   + p_tokens,
    monthly_tokens_used = ai_budgets.monthly_tokens_used + p_tokens,
    updated_at          = now();
END;
$$;

-- RLS
ALTER TABLE ai_dlq     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_dlq_select_own"     ON ai_dlq     FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ai_budgets_select_own" ON ai_budgets FOR SELECT TO authenticated USING (auth.uid() = user_id);
