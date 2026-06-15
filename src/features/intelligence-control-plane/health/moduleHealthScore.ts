import type { ModuleHealthScore, ModuleType } from "../types";
import { scoreToState } from "./healthThresholds";

/**
 * Build a ModuleHealthScore from raw counters.
 * Formula mirrors existing per-module health services.
 *
 * score = 100
 *   - failedJobs  × 5    (capped at 50)
 *   - dlqDepth    × 10   (capped at 30)
 *   - latency penalty    (capped at 20, 1pt per 500ms)
 */
export function computeModuleHealthScore(
  module:      ModuleType,
  total:       number,
  failed:      number,
  dlqDepth:    number,
  avgLatencyMs: number,
  retryCount:  number,
): ModuleHealthScore {
  const failureRate = total > 0 ? failed / total : 0;
  const retryRate   = total > 0 ? retryCount / total : 0;

  let score = 100;
  score -= Math.min(50, failed * 5);
  score -= Math.min(30, dlqDepth * 10);
  score -= Math.min(20, Math.floor(avgLatencyMs / 500));
  score  = Math.max(0, Math.min(100, score));

  return {
    module,
    score,
    failureRate,
    avgLatencyMs,
    dlqDepth,
    retryRate,
    state: scoreToState(score),
  };
}
