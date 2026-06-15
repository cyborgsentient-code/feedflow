-- Migration: automation_logs RLS (defense-in-depth, Module 6.2)
--
-- automation_logs.user_id is NOT NULL and populated by the execution engine.
-- RLS here is the first ownership layer; the service filter is the second.
--
-- Frontend: SELECT only (INSERT/UPDATE/DELETE are execution-engine responsibilities).

-- Enable RLS on the table (idempotent).
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated user may only read their own logs.
CREATE POLICY "automation_logs_select_own"
  ON automation_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: only the service role (execution engine) may insert.
-- No authenticated-user INSERT policy = INSERT blocked for all JWT users.

-- UPDATE / DELETE: no policies = blocked for all users (execution engine uses service role).
