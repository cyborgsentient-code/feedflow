-- Migration: automation_traces table + DLQ schema upgrade (Module 10.3)

-- Structured job traces (flushed by Edge Function workers)
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

-- Upgrade automation_dlq with failure classification columns
ALTER TABLE automation_dlq
  ADD COLUMN IF NOT EXISTS failure_category    TEXT,
  ADD COLUMN IF NOT EXISTS failure_reason      TEXT,
  ADD COLUMN IF NOT EXISTS last_worker_id      TEXT,
  ADD COLUMN IF NOT EXISTS last_error_snapshot TEXT;
