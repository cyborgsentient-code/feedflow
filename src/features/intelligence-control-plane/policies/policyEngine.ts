import type { PolicyRule, PolicyDecision, SystemEvent } from "../types";
import { rateLimitPolicy } from "./rateLimitPolicy";
import { budgetPolicy } from "./budgetPolicy";
import { fallbackRoutingPolicy } from "./fallbackRoutingPolicy";

/** Default declarative policy set. Editable at runtime via controlPlaneService. */
const policies: PolicyRule[] = [
  { id: "pol-execution-rate",   module: "execution",    type: "rate_limit",         limit: 100,  windowMs: 60_000,   enabled: true },
  { id: "pol-ai-budget",        module: "ai",           type: "budget_cap",         limit: 95,   windowMs: 86_400_000, enabled: true },
  { id: "pol-automation-queue", module: "automation",   type: "queue_backpressure", limit: 200,  windowMs: 60_000,   enabled: true },
  { id: "pol-profile-rebuild",  module: "intelligence", type: "rebuild_throttle",   limit: 10,   windowMs: 60_000,   enabled: true },
];

export const policyEngine = {
  /** Evaluate all matching enabled policies for an event. Returns first denial. */
  async evaluate(event: SystemEvent): Promise<PolicyDecision> {
    const matching = policies.filter((p) => p.module === event.module && p.enabled);

    for (const rule of matching) {
      let decision: PolicyDecision;

      if (rule.type === "rate_limit" || rule.type === "rebuild_throttle") {
        decision = rateLimitPolicy.check(rule, event);
      } else if (rule.type === "budget_cap") {
        decision = await budgetPolicy.check(rule, event);
      } else if (rule.type === "queue_backpressure") {
        decision = await fallbackRoutingPolicy.check(rule, event);
      } else {
        continue;
      }

      if (!decision.allowed) return decision;
      // Consume rate limit slot only on allowed
      if (rule.type === "rate_limit" || rule.type === "rebuild_throttle") {
        rateLimitPolicy.consume(rule, event);
      }
    }

    return { allowed: true };
  },

  upsertPolicy(policy: PolicyRule): void {
    const idx = policies.findIndex((p) => p.id === policy.id);
    if (idx >= 0) policies[idx] = policy;
    else policies.push(policy);
  },

  getAll(): PolicyRule[] {
    return [...policies];
  },
};
