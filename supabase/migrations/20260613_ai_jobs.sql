-- Migration: ai_jobs table (Module 12)

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
