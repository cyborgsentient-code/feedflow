export type ModuleType =
  | "feed"
  | "automation"
  | "execution"
  | "ai"
  | "intelligence";

export type SystemEventType =
  | "content_created" | "content_ingested"
  | "automation_triggered" | "automation_completed" | "automation_failed"
  | "execution_started"    | "execution_completed"  | "execution_failed"
  | "ai_task_run"          | "ai_task_completed"    | "ai_task_failed"
  | "profile_updated"      | "signal_generated"
  | "kill_switch_activated" | "policy_enforced"
  | "replay_requested"      | "replay_completed";

export type SystemEvent = {
  id:          string;
  module:      ModuleType;
  type:        SystemEventType;
  userId:      string;
  entityId:    string;           // contentId | jobId | executionId etc.
  fingerprint: string;           // SHA-256(module|type|entityId|userId)
  timestamp:   string;
  metadata:    Record<string, unknown>;
};

export type SystemTrace = {
  traceId:  string;
  userId:   string;
  entityId: string;
  events:   SystemEvent[];
  startedAt: string;
  lastSeen:  string;
};

export type ModuleHealthScore = {
  module:      ModuleType;
  score:       number;           // 0–100
  failureRate: number;
  avgLatencyMs: number;
  dlqDepth:    number;
  retryRate:   number;
  state:       "healthy" | "degraded" | "unstable" | "critical";
};

export type SystemHealth = {
  feedHealth:          ModuleHealthScore;
  automationHealth:    ModuleHealthScore;
  executionHealth:     ModuleHealthScore;
  aiHealth:            ModuleHealthScore;
  intelligenceHealth:  ModuleHealthScore;
  globalScore:         number;
  computedAt:          string;
};

export type KillSwitchCondition =
  | { type: "error_rate";   threshold: number }   // 0–1
  | { type: "latency_ms";   threshold: number }
  | { type: "budget_pct";   threshold: number }   // 0–100
  | { type: "dlq_size";     threshold: number };

export type KillSwitchAction =
  | "disable_ingestion"
  | "disable_execution"
  | "fallback_mode"
  | "read_only_mode";

export type KillSwitchRule = {
  id:        string;
  module:    ModuleType;
  condition: KillSwitchCondition;
  action:    KillSwitchAction;
  enabled:   boolean;
};

export type KillSwitchState = Record<ModuleType, KillSwitchAction | null>;

export type PolicyRule = {
  id:          string;
  module:      ModuleType;
  type:        "rate_limit" | "budget_cap" | "queue_backpressure" | "rebuild_throttle";
  limit:       number;
  windowMs:    number;
  enabled:     boolean;
};

export type PolicyDecision =
  | { allowed: true }
  | { allowed: false; reason: string; rule: PolicyRule };

export type ReplayRequest = {
  id:       string;
  userId:   string;
  module:   ModuleType;
  entityId: string;
  mode:     "execute" | "dry-run";
  requestedAt: string;
};

export type ReplayResult = {
  requestId: string;
  action:    "replayed" | "skipped" | "blocked_by_kill_switch" | "blocked_by_policy" | "not_found";
  details?:  string;
};

export type ControlCommand =
  | { type: "activate_kill_switch";   rule: KillSwitchRule }
  | { type: "deactivate_kill_switch"; ruleId: string }
  | { type: "update_policy";          policy: PolicyRule }
  | { type: "trigger_replay";         request: ReplayRequest };
