import type { HardeningRequest, HardeningDecision, RiskSignal, AnomalySignalName } from "../types";
import { detectRateAnomaly }    from "../signals/rateAnomalyDetector";
import { detectReplayAbuse }    from "../signals/replayAbuseDetector";
import { profileAdminBehavior } from "../signals/adminBehaviorProfiler";
import { detectBudgetAnomaly }  from "../signals/budgetAnomalyDetector";
import { detectTraceAnomaly }   from "../signals/traceAnomalyDetector";
import { computeRiskScore }     from "../scoring/riskScoringEngine";
import { decaySignal }          from "../scoring/decayModel";
import { evaluateHardeningPolicy } from "../policies/hardeningPolicyEngine";
import { hardeningMetrics }     from "../telemetry/hardeningMetrics";
import type { AdminRole } from "@/features/admin-console/types";

/** Last anomaly timestamps per userId:signal for decay. */
const lastSeen = new Map<string, number>();

function decayed(userId: string, name: AnomalySignalName, raw: number): number {
  const k   = `${userId}:${name}`;
  const now = Date.now();
  const age = now - (lastSeen.get(k) ?? now);
  if (raw > 0) lastSeen.set(k, now);
  return decaySignal(raw, age);
}

export const hardeningEngine = {
  async evaluate(request: HardeningRequest): Promise<HardeningDecision> {
    // 1. Collect all signals (async in parallel where possible)
    const [budgetRaw, traceRaw] = await Promise.all([
      detectBudgetAnomaly(request.userId),
      Promise.resolve(detectTraceAnomaly(request.userId)),
    ]);

    const rateRaw   = detectRateAnomaly(request.userId, request.module, request.action);
    const replayRaw = request.isReplay
      ? detectReplayAbuse(request.userId, request.entityId)
      : 0;
    const adminRaw  = request.isAdmin && request.adminId
      ? profileAdminBehavior(request.adminId, (request.metadata?.role as AdminRole) ?? "SUPPORT_ENGINEER", request.action)
      : 0;

    // 2. Apply decay
    const signals: RiskSignal[] = [
      { name: "rateAnomaly",   value: decayed(request.userId, "rateAnomaly",   rateRaw)   },
      { name: "replayAbuse",   value: decayed(request.userId, "replayAbuse",   replayRaw) },
      { name: "adminBehavior", value: decayed(request.userId, "adminBehavior", adminRaw)  },
      { name: "budgetAnomaly", value: decayed(request.userId, "budgetAnomaly", budgetRaw) },
      { name: "traceAnomaly",  value: decayed(request.userId, "traceAnomaly",  traceRaw)  },
    ];

    // 3. Score
    const anomalyScore = computeRiskScore(request.userId, signals);

    // 4. Policy decision
    const decision = evaluateHardeningPolicy(anomalyScore, signals);

    // 5. Metrics
    hardeningMetrics.record(decision.action);

    return decision;
  },
};
