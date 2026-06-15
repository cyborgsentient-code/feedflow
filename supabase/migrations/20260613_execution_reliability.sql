-- Migration: execution_reliability tables (Module 11.1)

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

ALTER TABLE execution_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_dlq    ENABLE ROW LEVEL SECURITY;

-- execution_traces: no user_id column — service-role write, no user read needed
-- execution_dlq: user-scoped reads
CREATE POLICY "execution_dlq_select_own" ON execution_dlq
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
