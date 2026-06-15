import type { HardeningRequest, HardeningDecision } from "../types";
import { hardeningEngine }  from "../services/hardeningEngine";
import { systemShield }     from "./systemShield";
import { actionQuarantine } from "./actionQuarantine";
import { riskEventLogger }  from "../telemetry/riskEventLogger";

const QUARANTINE_MAX = 500;   // hard cap — evict oldest on overflow

export const requestGate = {
  async evaluate(request: HardeningRequest): Promise<HardeningDecision> {
    // 1. Emergency shield fast-exit
    if (systemShield.isFullyBlocked()) {
      const d = systemShield.reject("GLOBAL_BLOCK active.");
      riskEventLogger.append(request.userId, d);
      return d;
    }

    const isWrite = !request.action.includes("read") && !request.action.includes("snapshot");
    if (isWrite && systemShield.isWriteBlocked()) {
      const d = systemShield.reject(`${systemShield.getMode()} — writes blocked.`);
      riskEventLogger.append(request.userId, d);
      return d;
    }

    // 2. Full scoring
    const decision = await hardeningEngine.evaluate(request);

    // 3. THROTTLE_ONLY_MODE: override allow/throttle decisions with a minimum throttle
    if (systemShield.isThrottleOnly() && decision.action === "allow") {
      const throttled: HardeningDecision = {
        ...decision, action: "throttle", delayMs: 500,
        appliedPolicy: "THROTTLE_ONLY_MODE", reason: "Shield in throttle-only mode.",
      };
      riskEventLogger.append(request.userId, throttled);
      return throttled;
    }

    // 4. Quarantine with overflow protection
    if (decision.action === "quarantine") {
      if (actionQuarantine.size() >= QUARANTINE_MAX) {
        actionQuarantine.drain();  // evict all when full — prevents memory exhaustion
      }
      actionQuarantine.enqueue(request as unknown as Record<string, unknown>, decision.riskScore);
    }

    // 5. Auto-shield at extreme risk
    if (decision.riskScore >= 95) {
      systemShield.activate("READ_ONLY_MODE");
    }

    riskEventLogger.append(request.userId, decision);
    return decision;
  },
};
