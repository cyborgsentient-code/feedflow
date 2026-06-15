import type { KillSwitchRule, KillSwitchAction, ModuleType } from "../types";

// Default rules — evaluated against live health scores
export const DEFAULT_KILL_SWITCH_RULES: KillSwitchRule[] = [
  {
    id:        "ks-feed-error-rate",
    module:    "feed",
    condition: { type: "error_rate", threshold: 0.5 },
    action:    "disable_ingestion",
    enabled:   true,
  },
  {
    id:        "ks-automation-dlq",
    module:    "automation",
    condition: { type: "dlq_size", threshold: 50 },
    action:    "fallback_mode",
    enabled:   true,
  },
  {
    id:        "ks-execution-error-rate",
    module:    "execution",
    condition: { type: "error_rate", threshold: 0.4 },
    action:    "disable_execution",
    enabled:   true,
  },
  {
    id:        "ks-ai-budget",
    module:    "ai",
    condition: { type: "budget_pct", threshold: 95 },
    action:    "fallback_mode",
    enabled:   true,
  },
  {
    id:        "ks-intelligence-dlq",
    module:    "intelligence",
    condition: { type: "dlq_size", threshold: 20 },
    action:    "read_only_mode",
    enabled:   true,
  },
];

export type KillSwitchConfig = {
  rules: KillSwitchRule[];
};

export function defaultConfig(): KillSwitchConfig {
  return { rules: [...DEFAULT_KILL_SWITCH_RULES] };
}
