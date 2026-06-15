import type { PolicyRule, PolicyDecision, SystemEvent } from "../types";

/** Rolling window counters keyed by "ruleId:userId" */
const counters = new Map<string, { count: number; windowStart: number }>();

function getCounter(key: string, windowMs: number): number {
  const entry = counters.get(key);
  if (!entry || Date.now() - entry.windowStart > windowMs) return 0;
  return entry.count;
}

function increment(key: string, windowMs: number): void {
  const entry = counters.get(key);
  if (!entry || Date.now() - entry.windowStart > windowMs) {
    counters.set(key, { count: 1, windowStart: Date.now() });
  } else {
    entry.count++;
  }
}

export const rateLimitPolicy = {
  /**
   * Pure evaluation — side-effect free check.
   * Call increment() separately only when the event is accepted.
   */
  check(rule: PolicyRule, event: SystemEvent): PolicyDecision {
    const key   = `${rule.id}:${event.userId}`;
    const count = getCounter(key, rule.windowMs);
    if (count >= rule.limit) {
      return { allowed: false, reason: `Rate limit exceeded: ${count}/${rule.limit} per ${rule.windowMs}ms`, rule };
    }
    return { allowed: true };
  },

  consume(rule: PolicyRule, event: SystemEvent): void {
    increment(`${rule.id}:${event.userId}`, rule.windowMs);
  },
};
