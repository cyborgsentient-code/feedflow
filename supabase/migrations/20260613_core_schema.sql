-- Migration: instagram_connections + user_settings + automation_logs core schema

-- ── instagram_connections ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS instagram_connections (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_user_id    TEXT,
  instagram_username   TEXT,
  access_token         TEXT,        -- store encrypted in prod; service-role only
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
-- INSERT/UPDATE only via service role (edge functions)

-- ── user_settings ─────────────────────────────────────────────────────────────
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
CREATE POLICY "settings_select_own" ON user_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "settings_update_own" ON user_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "settings_insert_own" ON user_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── automation_logs ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_logs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_user_id TEXT,
  job_id            UUID,
  action_type       TEXT        NOT NULL
                                CHECK (action_type IN ('like','view','search','visit','error',
                                  'hashtag_explored','account_discovered','post_liked',
                                  'reel_watched','profile_visited','keyword_searched',
                                  'reinforcement_calculated','snapshot_created')),
  category_slug     TEXT,
  metadata          JSONB       NOT NULL DEFAULT '{}',
  source            TEXT        NOT NULL DEFAULT 'automation_engine_v1',
  sequence_number   BIGINT      GENERATED ALWAYS AS IDENTITY,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS automation_logs_user_time_idx
  ON automation_logs (user_id, created_at DESC);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
-- RLS policy already exists from 20260612_automation_logs_rls.sql — skip if duplicate

-- ── reinforcement_scores ──────────────────────────────────────────────────────
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
