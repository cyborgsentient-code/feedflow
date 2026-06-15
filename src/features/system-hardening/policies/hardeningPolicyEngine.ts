import type { AnomalyScore, HardeningDecision } from "../types";
import { evaluateBlockingRules } from "./blockingRules";
import { adaptiveThrottlePolicy } from "./adaptiveThrottlePolicy";
import type { RiskSignal } from "../types";

/**
 * Declarative, hot-reloadable rules evaluated per request.
 * Returns the final HardeningDecision based on score thresholds.
 * Pure function — no side effects.
 */
export function evaluateHardeningPolicy(
  score:   AnomalyScore,
  signals: RiskSignal[],
): HardeningDecision {
  const triggeredSignals = signals
    .filter((s) => s.value > 0.1)
    .map((s) => s.name);

  // 1. Static blocking rules (overrides score)
  const blocking = evaluateBlockingRules(score, signals);
  if (blocking.blocked) {
    return { action: "block", riskScore: score.riskScore, triggeredSignals, appliedPolicy: "blocking_rule", reason: blocking.reason };
  }

  // 2. Score-based decision
  if (score.riskScore >= 90) {
    return { action: "block",      riskScore: score.riskScore, triggeredSignals, appliedPolicy: "score_threshold", reason: `Score ${score.riskScore} ≥ 90.` };
  }
  if (score.riskScore >= 70) {
    return { action: "quarantine", riskScore: score.riskScore, triggeredSignals, appliedPolicy: "score_threshold", reason: `Score ${score.riskScore} ≥ 70.` };
  }
  if (score.riskScore >= 40) {
    return adaptiveThrottlePolicy.apply(score);
  }

  return { action: "allow", riskScore: score.riskScore, triggeredSignals };
}
