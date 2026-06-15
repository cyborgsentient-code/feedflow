import type { RiskSignal, AnomalyScore, AnomalySignalName } from "../types";
import { SIGNAL_WEIGHTS, levelFromScore } from "./thresholdModel";

/**
 * Combines pre-decayed signals into a composite risk score [0–100].
 * Deterministic: same inputs → same output. Pure function.
 */
export function computeRiskScore(userId: string, signals: RiskSignal[]): AnomalyScore {
  const scores: Record<AnomalySignalName, number> = {
    rateAnomaly:   0,
    replayAbuse:   0,
    adminBehavior: 0,
    budgetAnomaly: 0,
    traceAnomaly:  0,
  };

  for (const s of signals) {
    scores[s.name] = Math.min(1, Math.max(0, s.value));
  }

  const raw = (Object.keys(SIGNAL_WEIGHTS) as AnomalySignalName[]).reduce(
    (sum, key) => sum + scores[key] * SIGNAL_WEIGHTS[key],
    0,
  );

  const riskScore = Math.round(Math.min(100, Math.max(0, raw * 100)));

  return {
    userId,
    scores,
    riskScore,
    level:      levelFromScore(riskScore),
    computedAt: new Date().toISOString(),
  };
}
