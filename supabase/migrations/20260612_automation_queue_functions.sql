-- Migration: SKIP LOCKED claim function + cleanup (Module 10.2)
--
-- This function is called by each Edge Function worker to atomically
-- claim a batch of pending jobs. SKIP LOCKED ensures two workers
-- never process the same row simultaneously.

CREATE OR REPLACE FUNCTION claim_automation_queue_batch(
  p_worker_id   TEXT,
  p_batch_size  INT  DEFAULT 50,
  p_lock_expiry INT  DEFAULT 30   -- seconds
)
RETURNS SETOF automation_queue
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE automation_queue
  SET
    status    = 'processing',
    locked_by = p_worker_id,
    locked_at = now()
  WHERE id IN (
    SELECT id
    FROM automation_queue
    WHERE
      status IN ('pending', 'failed')
      AND (next_retry_at IS NULL OR next_retry_at <= now())
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT p_batch_size
  )
  RETURNING *;
END;
$$;

-- Release stale locks held by crashed workers (run periodically via pg_cron)
CREATE OR REPLACE FUNCTION release_stale_automation_locks(p_timeout_seconds INT DEFAULT 60)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  released INT;
BEGIN
  UPDATE automation_queue
  SET status    = 'pending',
      locked_by = NULL,
      locked_at = NULL
  WHERE status    = 'processing'
    AND locked_at < now() - (p_timeout_seconds || ' seconds')::INTERVAL;

  GET DIAGNOSTICS released = ROW_COUNT;
  RETURN released;
END;
$$;

-- Optional: schedule stale-lock cleanup every minute (requires pg_cron extension)
-- SELECT cron.schedule('release-stale-locks', '* * * * *', $$SELECT release_stale_automation_locks(60)$$);
