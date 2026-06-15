import { supabase } from "@/lib/supabase";
import type { QueueHealth, HealthState } from "../types";

export const queueHealthService = {
  async compute(userId?: string): Promise<QueueHealth> {
    const now = new Date().toISOString();
    const staleThreshold = new Date(Date.now() - 60_000).toISOString();

    let base = supabase.from("automation_queue").select("status, attempts, created_at, locked_at");
    if (userId) base = (base as ReturnType<typeof base.eq>).eq("user_id", userId);
    const { data } = await base;
    const rows = data ?? [];

    const stuckJobs   = rows.filter((r) => r.status === "processing" && r.locked_at < staleThreshold);
    const pending     = rows.filter((r) => r.status === "pending");
    const done        = rows.filter((r) => r.status === "done");
    const failed      = rows.filter((r) => ["failed", "dead"].includes(r.status));
    const totalJobs   = done.length + failed.length;
    const allAttempts = rows.map((r) => Number(r.attempts ?? 0));
    const avgRetries  = allAttempts.length
      ? allAttempts.reduce((a, b) => a + b, 0) / allAttempts.length
      : 0;

    const oldest = pending
      .map((r) => new Date(r.created_at).getTime())
      .sort((a, b) => a - b)[0];
    const backlogAgeMs = oldest ? Date.now() - oldest : 0;

    const efficiency = totalJobs > 0 ? done.length / totalJobs : 1;

    // Score: 100 = perfect, drops for stuck jobs, high retries, old backlog, low efficiency
    let score = 100;
    score -= Math.min(40, stuckJobs.length * 10);
    score -= Math.min(20, Math.floor(avgRetries * 10));
    score -= Math.min(20, Math.floor(backlogAgeMs / 60_000) * 2);
    score -= Math.min(20, Math.floor((1 - efficiency) * 20));
    score  = Math.max(0, score);

    const state: HealthState =
      score >= 80 ? "healthy" :
      score >= 60 ? "degraded" :
      score >= 40 ? "unstable" : "critical";

    return {
      stuckJobsCount:   stuckJobs.length,
      retryPressure:    Math.round(avgRetries * 100) / 100,
      backlogAgeMs,
      workerEfficiency: Math.round(efficiency * 100) / 100,
      healthScore:      score,
      state,
    };
  },
};
