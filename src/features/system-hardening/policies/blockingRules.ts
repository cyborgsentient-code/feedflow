import type { AnomalyScore, HardeningDecision, RiskSignal } from "../types";

/** Static blocking rules evaluated before composite scoring. */
export function evaluateBlockingRules(
  score:   AnomalyScore,
  signals: RiskSignal[],
): { blocked: true; reason: string } | { blocked: false } {
  // Hard block: any single signal at maximum
  for (const s of signals) {
    if (s.value >= 1.0) return { blocked: true, reason: `Signal ${s.name} at maximum (1.0).` };
  }
  // Hard block: overall critical
  if (score.riskScore >= 90) return { blocked: true, reason: `Risk score ${score.riskScore} exceeds block threshold.` };
  return { blocked: false };
}
