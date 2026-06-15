-- Migration: reinforcement score RPC + automation loop cron schedule

-- Atomic upsert for reinforcement_scores
CREATE OR REPLACE FUNCTION increment_reinforcement_score(p_user_id UUID, p_delta INT DEFAULT 1)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO reinforcement_scores (user_id, total_score, actions_total, last_cycle_at, score_delta_7d)
  VALUES (p_user_id, p_delta, p_delta, now(), p_delta)
  ON CONFLICT (user_id) DO UPDATE SET
    total_score   = reinforcement_scores.total_score   + p_delta,
    actions_total = reinforcement_scores.actions_total + p_delta,
    cycle_count   = reinforcement_scores.cycle_count   + 1,
    last_cycle_at = now(),
    score_delta_7d = (
      SELECT COUNT(*)::INT FROM automation_logs
      WHERE user_id = p_user_id
        AND created_at >= now() - INTERVAL '7 days'
    ),
    updated_at    = now();
END;
$$;

-- Schedule automation loop every 15 minutes (requires pg_cron + net extension)
-- Uncomment and replace <FUNCTION_URL> + <SERVICE_KEY> after deploy:
-- SELECT cron.schedule(
--   'automation-loop',
--   '*/15 * * * *',
--   $$ SELECT net.http_post(
--       url:='<SUPABASE_FUNCTIONS_URL>/automation-loop',
--       headers:='{"Content-Type":"application/json","Authorization":"Bearer <SERVICE_KEY>"}'::jsonb
--   ) $$
-- );
