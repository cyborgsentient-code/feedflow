import type { ReplayRequest, ReplayResult } from "../types";
import { killSwitchState } from "../kill-switch/killSwitchState";
import { policyEngine } from "../policies/policyEngine";
import { globalTraceCollector } from "../tracing/globalTraceCollector";

export const replaySafetyValidator = {
  async validate(
    request: ReplayRequest,
    ownerUserId: string,
  ): Promise<{ safe: true } | { safe: false; reason: string }> {
    // Ownership check
    if (request.userId !== ownerUserId) {
      return { safe: false, reason: "Ownership violation: userId mismatch." };
    }

    // Kill switch check
    if (killSwitchState.isActive(request.module)) {
      const action = killSwitchState.getAction(request.module);
      if (action === "disable_execution" || action === "fallback_mode") {
        return { safe: false, reason: `Kill switch active on ${request.module}: ${action}` };
      }
    }

    // Policy check — synthesise a minimal event to run through the engine
    const fakeEvent = {
      id: request.id, module: request.module, type: "replay_requested" as const,
      userId: request.userId, entityId: request.entityId,
      fingerprint: "", timestamp: request.requestedAt, metadata: {},
    };
    const decision = await policyEngine.evaluate(fakeEvent);
    if (!decision.allowed) {
      return { safe: false, reason: decision.reason };
    }

    return { safe: true };
  },
};
