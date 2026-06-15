-- Migration: automation_events table (must exist before automation_dlq alters it)

CREATE TABLE IF NOT EXISTS automation_events (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type       TEXT        NOT NULL,
  content_id       TEXT,
  payload          JSONB       NOT NULL DEFAULT '{}',
  sequence_number  BIGINT,
  fingerprint      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE automation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select_own" ON automation_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
