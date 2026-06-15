import type { SystemHealth, KillSwitchRule } from "../types";
import { killSwitchState } from "./killSwitchState";
import { defaultConfig } from "./killSwitchRules";

const config = defaultConfig();

/**
 * Evaluate all enabled rules against the current health snapshot.
 * Activates or deactivates kill switches in-place.
 * Called by systemHealthAggregator after every health compute.
 */
export const killSwitchEngine = {
  evaluate(health: SystemHealth): void {
    for (const rule of config.rules) {
      if (!rule.enabled) continue;

      const moduleHealth = healthForModule(health, rule.module);
      const triggered    = evaluateCondition(rule, moduleHealth);

      if (triggered) {
        killSwitchState.activate(rule.module, rule.action);
      } else {
        // Only deactivate if this specific rule was the one that triggered
        if (killSwitchState.getAction(rule.module) === rule.action) {
          killSwitchState.deactivate(rule.module);
        }
      }
    }
  },

  addRule(rule: KillSwitchRule): void {
    const idx = config.rules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) config.rules[idx] = rule;
    else config.rules.push(rule);
  },

  removeRule(ruleId: string): void {
    const idx = config.rules.findIndex((r) => r.id === ruleId);
    if (idx >= 0) config.rules.splice(idx, 1);
  },
};

function healthForModule(health: SystemHealth, module: string) {
  const map: Record<string, typeof health.feedHealth> = {
    feed:         health.feedHealth,
    automation:   health.automationHealth,
    execution:    health.executionHealth,
    ai:           health.aiHealth,
    intelligence: health.intelligenceHealth,
  };
  return map[module]!;
}

function evaluateCondition(
  rule:         KillSwitchRule,
  moduleHealth: { failureRate: number; avgLatencyMs: number; dlqDepth: number },
): boolean {
  const { condition } = rule;
  switch (condition.type) {
    case "error_rate": return moduleHealth.failureRate   >= condition.threshold;
    case "latency_ms": return moduleHealth.avgLatencyMs  >= condition.threshold;
    case "dlq_size":   return moduleHealth.dlqDepth      >= condition.threshold;
    case "budget_pct": return false; // evaluated by budgetPolicy directly
  }
}
