import type { AnomalyScore, HardeningDecision } from "../types";

/** Soft throttle: returns delay in ms proportional to risk score. Pure. */
export function computeThrottleDelay(score: AnomalyScore): number {
  // Score 40–69 maps to 200ms–2000ms delay
  if (score.riskScore < 40) return 0;
  return Math.round(((score.riskScore - 40) / 30) * 1800 + 200);
}

export const adaptiveThrottlePolicy = {
  apply(score: AnomalyScore): HardeningDecision {
    const delayMs = computeThrottleDelay(score);
    return {
      action:           "throttle",
      riskScore:        score.riskScore,
      triggeredSignals: Object.entries(score.scores)
        .filter(([, v]) => v > 0.2)
        .map(([k]) => k),
      appliedPolicy:    "adaptive_throttle",
      delayMs,
      reason:           `Throttled ${delayMs}ms (risk ${score.riskScore}).`,
    };
  },
};
