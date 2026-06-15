-- Migration: traceability + execution audit stream

-- ── 1. Extend automation_logs with trace fields ───────────────────────────────
ALTER TABLE automation_logs
  ADD COLUMN IF NOT EXISTS trace_id           UUID        NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS parent_trace_id    UUID,
  ADD COLUMN IF NOT EXISTS execution_batch_id UUID;

-- instagram_user_id NOT NULL enforcement (soft: existing rows may be null, new ones must not)
-- Applied at application layer (edge function validates before insert).
-- Hard constraint deferred until existing data is backfilled:
-- ALTER TABLE automation_logs ALTER COLUMN instagram_user_id SET NOT NULL;

-- Index for batch-level reconstruction
CREATE INDEX IF NOT EXISTS automation_logs_batch_idx
  ON automation_logs (execution_batch_id, created_at DESC);

-- ── 2. automation_execution_trace ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_execution_trace (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        UUID        NOT NULL UNIQUE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ,
  total_actions   INT         NOT NULL DEFAULT 0,
  success_count   INT         NOT NULL DEFAULT 0,
  failure_count   INT         NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'running'
                              CHECK (status IN ('running','success','partial','failed')),
  demo_mode       BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS exec_trace_user_idx
  ON automation_execution_trace (user_id, started_at DESC);

ALTER TABLE automation_execution_trace ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exec_trace_select_own" ON automation_execution_trace
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
