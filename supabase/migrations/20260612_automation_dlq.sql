-- Migration: automation_dlq + automation_events hardening (Module 10.1)

-- Persistent dead-letter queue
CREATE TABLE IF NOT EXISTS automation_dlq (
  fingerprint     TEXT PRIMARY KEY,
  user_id         UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id      TEXT  NOT NULL,
  rule_id         TEXT  NOT NULL,
  error_type      TEXT  NOT NULL,
  payload         JSONB NOT NULL,
  retry_count     INT   NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE automation_dlq ENABLE ROW LEVEL SECURITY;
-- Service role writes; authenticated users can read their own entries.
CREATE POLICY "dlq_select_own" ON automation_dlq
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- automation_events: add sequence_number + fingerprint uniqueness
ALTER TABLE automation_events
  ADD COLUMN IF NOT EXISTS sequence_number BIGINT,
  ADD COLUMN IF NOT EXISTS fingerprint     TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS automation_events_fingerprint_key
  ON automation_events (fingerprint)
  WHERE fingerprint IS NOT NULL;

-- RLS
ALTER TABLE automation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select_own" ON automation_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
