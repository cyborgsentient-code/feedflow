import type { ThreatLevel } from "../types";

export const SIGNAL_WEIGHTS = {
  rateAnomaly:   0.25,
  replayAbuse:   0.20,
  adminBehavior: 0.20,
  budgetAnomaly: 0.20,
  traceAnomaly:  0.15,
} as const;

/** Per-module score thresholds for throttle/quarantine/block. */
export const SCORE_THRESHOLDS = {
  allow:      [0,  39],
  throttle:   [40, 69],
  quarantine: [70, 89],
  block:      [90, 100],
} as const;

export function levelFromScore(score: number): ThreatLevel {
  if (score >= 90) return "critical";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  if (score >= 10) return "low";
  return "none";
}
