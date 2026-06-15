import type { HardeningRequest, HardeningDecision } from "../types";
import { requestGate } from "../enforcement/requestGate";

/** Thin public API — returns a HardeningDecision for any incoming request. */
export const hardeningDecisionService = {
  async decide(request: HardeningRequest): Promise<HardeningDecision> {
    return requestGate.evaluate(request);
  },

  /** Convenience: check and throw if blocked (for use in service wrappers). */
  async guard(request: HardeningRequest): Promise<void> {
    const decision = await requestGate.evaluate(request);
    if (decision.action === "block") {
      throw new Error(`[Hardening] Blocked: ${decision.reason ?? "risk score exceeded"}`);
    }
    if (decision.action === "throttle" && decision.delayMs) {
      await new Promise((r) => setTimeout(r, decision.delayMs));
    }
  },
};
