import { supabase } from "@/lib/supabase";
import type { QueueMetrics } from "../types";

// Rolling 1-minute window counters (in-memory, reset on module reload)
let _processed = 0;
let _failed    = 0;
let _dlqAdded  = 0;
let _batchLatencies: number[] = [];
let _claimed   = 0;
let _skipped   = 0;
let _windowStart = Date.now();

export const metricsCollector = {
  recordProcessed()             { _processed++; },
  recordFailed()                { _failed++; },
  recordDLQ()                   { _dlqAdded++; },
  recordBatchLatency(ms: number){ _batchLatencies.push(ms); },
  recordClaimed(n: number)      { _claimed += n; },
  recordSkipped(n: number)      { _skipped += n; },

  async snapshot(userId?: string): Promise<QueueMetrics> {
    const now    = Date.now();
    const ageMin = Math.max(1, (now - _windowStart) / 60_000);

    // Live queue depth from DB
    let q = supabase.from("automation_queue").select("id", { count: "exact", head: true })
      .in("status", ["pending", "processing", "failed"]);
    if (userId) q = (q as ReturnType<typeof q.eq>).eq("user_id", userId);
    const { count: queueDepth } = await q;

    const avgLatency = _batchLatencies.length
      ? Math.round(_batchLatencies.reduce((a, b) => a + b, 0) / _batchLatencies.length)
      : 0;

    const totalJobs      = _processed + _failed;
    const efficiency     = _claimed + _skipped > 0
      ? _claimed / (_claimed + _skipped)
      : 1;

    return {
      queueDepth:             queueDepth ?? 0,
      jobsProcessedPerMinute: Math.round(_processed / ageMin),
      jobsFailedPerMinute:    Math.round(_failed / ageMin),
      retryRate:              totalJobs > 0 ? (_failed / totalJobs) : 0,
      dlqGrowthRate:          Math.round(_dlqAdded / ageMin),
      workerBatchLatencyMs:   avgLatency,
      skipLockedEfficiency:   efficiency,
    };
  },

  resetWindow() {
    _processed = 0; _failed = 0; _dlqAdded = 0;
    _batchLatencies = []; _claimed = 0; _skipped = 0;
    _windowStart = Date.now();
  },
};
