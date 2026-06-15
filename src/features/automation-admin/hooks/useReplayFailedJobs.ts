import { useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { dlqReader } from "../../automation-recovery/services/dlqReader";
import { replayService, type ReplayMode, type ReplayReport } from "../../automation-recovery/services/replayService";
import type { FailureCategory } from "../../automation-observability/types";

export function useReplayFailedJobs() {
  const { user } = useAuthStore();
  const [report,  setReport]  = useState<ReplayReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const replay = useCallback(async (opts: {
    mode?:            ReplayMode;
    failureCategory?: FailureCategory;
    limit?:           number;
  } = {}) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const jobs = await dlqReader.getFailedJobs({
        userId:          user.id,
        failureCategory: opts.failureCategory,
        limit:           opts.limit ?? 50,
      });
      const result = opts.failureCategory
        ? await replayService.requeueByCategory(jobs, opts.failureCategory, opts.mode ?? "execute")
        : await replayService.requeue(jobs, opts.mode ?? "execute");
      setReport(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Replay failed");
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { replay, report, loading, error };
}
