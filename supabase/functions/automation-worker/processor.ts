import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_RETRIES    = 3;
const BATCH_SIZE     = 50;
const LOCK_TIMEOUT_S = 30;

type QueueRow = {
  id:          string;
  user_id:     string;
  content_id:  string;
  rule_id:     string;
  fingerprint: string;
  attempts:    number;
  payload:     Record<string, unknown>;
};

type FailureCategory =
  | "network_failure" | "rule_evaluation_failure" | "db_timeout_failure"
  | "lock_acquisition_failure" | "duplicate_event" | "unknown_failure";

function classifyError(e: unknown): { category: FailureCategory; reason: string; snapshot: string } {
  const msg      = e instanceof Error ? e.message : String(e);
  const snapshot = e instanceof Error && e.stack ? e.stack.slice(0, 500) : msg.slice(0, 500);
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("ECONNREFUSED"))
    return { category: "network_failure",         reason: "Network unreachable", snapshot };
  if (msg.includes("timeout") || msg.includes("57014"))
    return { category: "db_timeout_failure",       reason: "DB query timeout",   snapshot };
  if (msg.includes("lock")   || msg.includes("55P03"))
    return { category: "lock_acquisition_failure", reason: "Lock not acquired",  snapshot };
  if (msg.includes("23505")  || msg.includes("unique"))
    return { category: "duplicate_event",          reason: "Already emitted",    snapshot };
  return { category: "unknown_failure", reason: msg.slice(0, 200), snapshot };
}

export async function processBatch(
  workerId: string,
): Promise<{ processed: number; failed: number; batchLatencyMs: number }> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const batchStart = Date.now();

  const { data: jobs, error: claimError } = await supabase.rpc("claim_automation_queue_batch", {
    p_worker_id:   workerId,
    p_batch_size:  BATCH_SIZE,
    p_lock_expiry: LOCK_TIMEOUT_S,
  });

  if (claimError || !jobs?.length) return { processed: 0, failed: 0, batchLatencyMs: 0 };

  let processed = 0;
  let failed    = 0;
  const traces: unknown[] = [];

  for (const job of jobs as QueueRow[]) {
    const traceId   = crypto.randomUUID();
    const startTime = new Date().toISOString();

    try {
      // ── Layer 3 guard: skip if event already emitted ───────────────────
      const { data: existing } = await supabase
        .from("automation_events")
        .select("fingerprint")
        .eq("fingerprint", job.fingerprint)
        .maybeSingle();

      if (existing) {
        // Already processed — mark done without re-emitting
        await supabase.from("automation_queue").update({ status: "done", locked_by: null }).eq("id", job.id);
        traces.push({ traceId, jobId: job.id, userId: job.user_id, contentId: job.content_id,
          ruleId: job.rule_id, workerId, startTime, endTime: new Date().toISOString(),
          durationMs: Date.now() - new Date(startTime).getTime(),
          status: "success", failureCategory: "duplicate_event" });
        processed++;
        continue;
      }

      // ── Emit ───────────────────────────────────────────────────────────
      const { error: emitError } = await supabase
        .from("automation_events")
        .upsert(
          { user_id: job.user_id, content_id: job.content_id, rule_id: job.rule_id,
            fingerprint: job.fingerprint, status: "processed", metadata: job.payload,
            created_at: new Date().toISOString() },
          { onConflict: "fingerprint" },
        );
      if (emitError) throw emitError;

      await supabase.from("automation_queue").update({ status: "done", locked_by: null }).eq("id", job.id);

      traces.push({ traceId, jobId: job.id, userId: job.user_id, contentId: job.content_id,
        ruleId: job.rule_id, workerId, startTime, endTime: new Date().toISOString(),
        durationMs: Date.now() - new Date(startTime).getTime(), status: "success", failureCategory: null });
      processed++;

    } catch (e) {
      const { category, reason, snapshot } = classifyError(e);
      const nextAttempt = job.attempts + 1;
      const isDead      = nextAttempt >= MAX_RETRIES;

      await supabase.from("automation_queue").update({
        status:        isDead ? "dead" : "failed",
        attempts:      nextAttempt,
        locked_by:     null,
        locked_at:     null,
        next_retry_at: isDead ? null : new Date(Date.now() + 1000 * 2 ** nextAttempt).toISOString(),
      }).eq("id", job.id);

      if (isDead) {
        await supabase.from("automation_dlq").upsert({
          fingerprint:         job.fingerprint,
          user_id:             job.user_id,
          content_id:          job.content_id,
          rule_id:             job.rule_id,
          failure_category:    category,
          failure_reason:      reason,
          last_worker_id:      workerId,
          last_error_snapshot: snapshot,
          payload:             job.payload,
          retry_count:         nextAttempt,
          last_attempt_at:     new Date().toISOString(),
          created_at:          new Date().toISOString(),
        }, { onConflict: "fingerprint" });
      }

      traces.push({ traceId, jobId: job.id, userId: job.user_id, contentId: job.content_id,
        ruleId: job.rule_id, workerId, startTime, endTime: new Date().toISOString(),
        durationMs: Date.now() - new Date(startTime).getTime(), status: "failed", failureCategory: category });
      failed++;
    }
  }

  // Flush traces to DB (best-effort — worker result not blocked on trace write)
  if (traces.length) {
    await supabase.from("automation_traces").insert(traces).then(() => {});
  }

  return { processed, failed, batchLatencyMs: Date.now() - batchStart };
}
