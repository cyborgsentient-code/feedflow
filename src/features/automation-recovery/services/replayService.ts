import { supabase } from "@/lib/supabase";
import type { DLQEntry } from "../../automation-observability/types";

export type ReplayMode = "dry-run" | "execute";

export type ReplayResult = {
  fingerprint: string;
  action:      "requeued" | "skipped_duplicate" | "skipped_dry_run";
  durationMs:  number;
};

export type ReplayReport = {
  mode:      ReplayMode;
  total:     number;
  requeued:  number;
  skipped:   number;
  results:   ReplayResult[];
  totalMs:   number;
};

export const replayService = {
  async requeue(jobs: DLQEntry[], mode: ReplayMode = "execute"): Promise<ReplayReport> {
    const t0 = Date.now();
    const results: ReplayResult[] = [];

    for (const job of jobs) {
      const jt = Date.now();

      if (mode === "dry-run") {
        results.push({ fingerprint: job.fingerprint, action: "skipped_dry_run", durationMs: Date.now() - jt });
        continue;
      }

      // Insert back into automation_queue — fingerprint UNIQUE makes this idempotent.
      // If already queued/processed, conflict is silently ignored.
      const { error } = await supabase
        .from("automation_queue")
        .insert({
          user_id:     job.userId,
          content_id:  job.contentId,
          rule_id:     job.ruleId,
          fingerprint: job.fingerprint,
          status:      "pending",
          attempts:    0,
          payload:     job.payload,
        });

      const isDuplicate = error?.code === "23505";
      if (error && !isDuplicate) {
        results.push({ fingerprint: job.fingerprint, action: "skipped_duplicate", durationMs: Date.now() - jt });
        continue;
      }

      results.push({
        fingerprint: job.fingerprint,
        action:      isDuplicate ? "skipped_duplicate" : "requeued",
        durationMs:  Date.now() - jt,
      });
    }

    const requeued = results.filter((r) => r.action === "requeued").length;
    const skipped  = results.length - requeued;

    return { mode, total: jobs.length, requeued, skipped, results, totalMs: Date.now() - t0 };
  },

  /** Partial replay by failure category. */
  async requeueByCategory(
    jobs:     DLQEntry[],
    category: DLQEntry["failureCategory"],
    mode:     ReplayMode = "execute",
  ): Promise<ReplayReport> {
    return this.requeue(jobs.filter((j) => j.failureCategory === category), mode);
  },
};
