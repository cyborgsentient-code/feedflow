-- ============================================================
-- FeedFlow — full schema seed (run once on a fresh project)
-- ============================================================

-- ── 1. profiles ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name        TEXT,
  avatar_url          TEXT,
  bio                 TEXT,
  interests           TEXT[]      NOT NULL DEFAULT '{}',
  onboarding_complete BOOLEAN     NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (new.id) ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 2. instagram_connections ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS instagram_connections (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_user_id    TEXT,
  instagram_username   TEXT,
  access_token         TEXT,
  connected_at         TIMESTAMPTZ,
  status               TEXT        NOT NULL DEFAULT 'disconnected'
                                   CHECK (status IN ('connected','disconnected','connecting','failed')),
  connection_error     TEXT,
  last_sync_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE instagram_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ig_select_own" ON instagram_connections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ── 3. user_settings ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  user_id                    UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  automation_enabled         BOOLEAN NOT NULL DEFAULT true,
  automation_frequency_hours INT     NOT NULL DEFAULT 1,
  notifications_enabled      BOOLEAN NOT NULL DEFAULT true,
  notify_on_cycle_complete   BOOLEAN NOT NULL DEFAULT false,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select_own" ON user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "settings_update_own" ON user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "settings_insert_own" ON user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── 4. automation_logs ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_logs (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_user_id  TEXT,
  job_id             UUID,
  action_type        TEXT        NOT NULL
                                 CHECK (action_type IN ('like','view','search','visit','error',
                                   'hashtag_explored','account_discovered','post_liked',
                                   'reel_watched','profile_visited','keyword_searched',
                                   'reinforcement_calculated','snapshot_created')),
  category_slug      TEXT,
  metadata           JSONB       NOT NULL DEFAULT '{}',
  source             TEXT        NOT NULL DEFAULT 'automation_engine_v1',
  sequence_number    BIGINT      GENERATED ALWAYS AS IDENTITY,
  trace_id           UUID        NOT NULL DEFAULT gen_random_uuid(),
  parent_trace_id    UUID,
  execution_batch_id UUID,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS automation_logs_user_time_idx ON automation_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS automation_logs_batch_idx ON automation_logs (execution_batch_id, created_at DESC);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_logs_select_own" ON automation_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ── 5. reinforcement_scores ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reinforcement_scores (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_score    INT         NOT NULL DEFAULT 0,
  cycle_count    INT         NOT NULL DEFAULT 0,
  actions_total  INT         NOT NULL DEFAULT 0,
  last_cycle_at  TIMESTAMPTZ,
  score_delta_7d INT         NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reinforcement_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scores_select_own" ON reinforcement_scores
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ── 6. automation_events ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type      TEXT        NOT NULL,
  content_id      TEXT,
  payload         JSONB       NOT NULL DEFAULT '{}',
  sequence_number BIGINT,
  fingerprint     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS automation_events_fingerprint_key
  ON automation_events (fingerprint) WHERE fingerprint IS NOT NULL;

ALTER TABLE automation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select_own" ON automation_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ── 7. automation_dlq ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_dlq (
  fingerprint         TEXT        PRIMARY KEY,
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id          TEXT        NOT NULL,
  rule_id             TEXT        NOT NULL,
  error_type          TEXT        NOT NULL,
  payload             JSONB       NOT NULL,
  retry_count         INT         NOT NULL DEFAULT 0,
  last_attempt_at     TIMESTAMPTZ NOT NULL,
  failure_category    TEXT,
  failure_reason      TEXT,
  last_worker_id      TEXT,
  last_error_snapshot TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE automation_dlq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dlq_select_own" ON automation_dlq
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ── 8. automation_queue ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_queue (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id    TEXT        NOT NULL,
  rule_id       TEXT        NOT NULL,
  fingerprint   TEXT        NOT NULL UNIQUE,
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','processing','done','failed','dead')),
  attempts      INT         NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  locked_by     TEXT,
  locked_at     TIMESTAMPTZ,
  payload       JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS automation_queue_worker_idx
  ON automation_queue (status, next_retry_at, created_at)
  WHERE status IN ('pending','failed');

ALTER TABLE automation_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "queue_select_own" ON automation_queue
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION claim_automation_queue_batch(
  p_worker_id TEXT, p_batch_size INT DEFAULT 50, p_lock_expiry INT DEFAULT 30
) RETURNS SETOF automation_queue LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  UPDATE automation_queue
  SET status = 'processing', locked_by = p_worker_id, locked_at = now()
  WHERE id IN (
    SELECT id FROM automation_queue
    WHERE status IN ('pending','failed')
      AND (next_retry_at IS NULL OR next_retry_at <= now())
    ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT p_batch_size
  )
  RETURNING *;
END;
$$;

CREATE OR REPLACE FUNCTION release_stale_automation_locks(p_timeout_seconds INT DEFAULT 60)
RETURNS INT LANGUAGE plpgsql AS $$
DECLARE released INT;
BEGIN
  UPDATE automation_queue
  SET status = 'pending', locked_by = NULL, locked_at = NULL
  WHERE status = 'processing'
    AND locked_at < now() - (p_timeout_seconds || ' seconds')::INTERVAL;
  GET DIAGNOSTICS released = ROW_COUNT;
  RETURN released;
END;
$$;

-- ── 9. automation_traces ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_traces (
  trace_id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           TEXT        NOT NULL,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id       TEXT        NOT NULL,
  rule_id          TEXT        NOT NULL,
  worker_id        TEXT        NOT NULL,
  start_time       TIMESTAMPTZ NOT NULL,
  end_time         TIMESTAMPTZ,
  duration_ms      INT,
  status           TEXT        NOT NULL CHECK (status IN ('running','success','failed')),
  failure_category TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS automation_traces_user_idx ON automation_traces (user_id, start_time DESC);

ALTER TABLE automation_traces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "traces_select_own" ON automation_traces
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ── 10. automation_execution_trace ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_execution_trace (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      UUID        NOT NULL UNIQUE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ,
  total_actions INT         NOT NULL DEFAULT 0,
  success_count INT         NOT NULL DEFAULT 0,
  failure_count INT         NOT NULL DEFAULT 0,
  status        TEXT        NOT NULL DEFAULT 'running'
                            CHECK (status IN ('running','success','partial','failed')),
  demo_mode     BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS exec_trace_user_idx ON automation_execution_trace (user_id, started_at DESC);

ALTER TABLE automation_execution_trace ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exec_trace_select_own" ON automation_execution_trace
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ── 11. ai_jobs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_jobs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id   TEXT        NOT NULL,
  task_type    TEXT        NOT NULL,
  fingerprint  TEXT        NOT NULL UNIQUE,
  status       TEXT        NOT NULL DEFAULT 'queued'
               CHECK (status IN ('queued','processing','completed','failed')),
  prompt       TEXT,
  result       JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ai_jobs_user_idx ON ai_jobs (user_id, created_at DESC);

ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_jobs_select_own" ON ai_jobs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ── 12. ai_traces (no user FK — service role only) ───────────────────────────
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

-- ── 13. ai_dlq ────────────────────────────────────────────────────────────────
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

ALTER TABLE ai_dlq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_dlq_select_own" ON ai_dlq
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ── 14. ai_budgets ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_budgets (
  user_id             UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_budget_usd    NUMERIC(10,6) NOT NULL DEFAULT 1.00,
  monthly_budget_usd  NUMERIC(10,6) NOT NULL DEFAULT 20.00,
  daily_token_limit   INT           NOT NULL DEFAULT 100000,
  monthly_token_limit INT           NOT NULL DEFAULT 2000000,
  daily_usage_usd     NUMERIC(10,6) NOT NULL DEFAULT 0,
  monthly_usage_usd   NUMERIC(10,6) NOT NULL DEFAULT 0,
  daily_tokens_used   INT           NOT NULL DEFAULT 0,
  monthly_tokens_used INT           NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE ai_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_budgets_select_own" ON ai_budgets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION increment_ai_budget_usage(
  p_user_id UUID, p_cost_usd NUMERIC, p_tokens INT
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

-- ── 15. execution_traces (no user FK — service role only) ────────────────────
CREATE TABLE IF NOT EXISTS execution_traces (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id     TEXT        NOT NULL,
  fingerprint      TEXT        NOT NULL,
  action_type      TEXT        NOT NULL,
  status           TEXT        NOT NULL CHECK (status IN ('success','failed')),
  failure_category TEXT,
  started_at       TIMESTAMPTZ NOT NULL,
  finished_at      TIMESTAMPTZ,
  duration_ms      INT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS execution_traces_execution_idx ON execution_traces (execution_id);
ALTER TABLE execution_traces ENABLE ROW LEVEL SECURITY;

-- ── 16. execution_dlq ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS execution_dlq (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint      TEXT        NOT NULL UNIQUE,
  execution_id     TEXT        NOT NULL,
  action_type      TEXT        NOT NULL,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  failure_category TEXT        NOT NULL,
  error_message    TEXT        NOT NULL,
  retry_count      INT         NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE execution_dlq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "execution_dlq_select_own" ON execution_dlq
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ── 17. reinforcement_scores RPC ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_reinforcement_score(p_user_id UUID, p_delta INT DEFAULT 1)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO reinforcement_scores (user_id, total_score, actions_total, last_cycle_at, score_delta_7d)
  VALUES (p_user_id, p_delta, p_delta, now(), p_delta)
  ON CONFLICT (user_id) DO UPDATE SET
    total_score    = reinforcement_scores.total_score   + p_delta,
    actions_total  = reinforcement_scores.actions_total + p_delta,
    cycle_count    = reinforcement_scores.cycle_count   + 1,
    last_cycle_at  = now(),
    score_delta_7d = (
      SELECT COUNT(*)::INT FROM automation_logs
      WHERE user_id = p_user_id AND created_at >= now() - INTERVAL '7 days'
    ),
    updated_at     = now();
END;
$$;

-- ── 18. interest_categories ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interest_categories (
  id          SERIAL PRIMARY KEY,
  slug        TEXT   NOT NULL UNIQUE,
  label       TEXT   NOT NULL,
  icon        TEXT,
  hashtags    TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  sort_order  INT    NOT NULL DEFAULT 0
);

INSERT INTO interest_categories (slug, label, icon, hashtags, sort_order) VALUES
('technology',  'Technology',  '💻', '{}', 1),
('design',      'Design',      '🎨', '{}', 2),
('fitness',     'Fitness',     '💪', '{}', 3),
('food',        'Food',        '🍜', '{}', 4),
('travel',      'Travel',      '✈️', '{}', 5),
('music',       'Music',       '🎵', '{}', 6),
('photography', 'Photography', '📷', '{}', 7),
('gaming',      'Gaming',      '🎮', '{}', 8),
('business',    'Business',    '📈', '{}', 9),
('art',         'Art',         '🖼️', '{}', 10),
('science',     'Science',     '🔬', '{}', 11),
('fashion',     'Fashion',     '👗', '{}', 12)
ON CONFLICT (slug) DO NOTHING;
