import { hardeningMetrics } from "../telemetry/hardeningMetrics";
import { systemShield }     from "../enforcement/systemShield";
import { actionQuarantine } from "../enforcement/actionQuarantine";
import { riskEventLogger }  from "../telemetry/riskEventLogger";

export const systemRiskService = {
  /** System-wide risk summary for dashboard consumption. */
  snapshot() {
    const metrics     = hardeningMetrics.snapshot();
    const shieldMode  = systemShield.getMode();
    const quarantined = actionQuarantine.size();
    const recentRisk  = riskEventLogger.recent(100);

    const blockRate = metrics.total > 0
      ? (metrics.blocked + metrics.quarantined) / metrics.total
      : 0;

    // Derive a system risk score from block rate + active shield
    const shieldPenalty = shieldMode !== "OFF" ? 30 : 0;
    const systemRiskScore = Math.min(100, Math.round(blockRate * 70 + shieldPenalty));

    return {
      systemRiskScore,
      shieldMode,
      quarantinedCount: quarantined,
      metrics,
      recentHighRisk: recentRisk.filter((e) => e.decision.riskScore >= 70),
    };
  },
};
