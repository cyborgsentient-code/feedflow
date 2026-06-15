-- Migration: automation_queue table (Module 10.2)
-- Replaces in-process execution queue with DB-native job queue.
-- Workers use SELECT ... FOR UPDATE SKIP LOCKED for safe concurrent processing.

CREATE TABLE IF NOT EXISTS automation_queue (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id     TEXT        NOT NULL,
  rule_id        TEXT        NOT NULL,
  fingerprint    TEXT        NOT NULL UNIQUE,
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','processing','done','failed','dead')),
  attempts       INT         NOT NULL DEFAULT 0,
  next_retry_at  TIMESTAMPTZ,
  locked_by      TEXT,                         -- worker_id
  locked_at      TIMESTAMPTZ,
  payload        JSONB       NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS automation_queue_worker_idx
  ON automation_queue (status, next_retry_at, created_at)
  WHERE status IN ('pending', 'failed');

ALTER TABLE automation_queue ENABLE ROW LEVEL SECURITY;
-- Only service-role workers write; authenticated users may read their own rows.
CREATE POLICY "queue_select_own" ON automation_queue
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
