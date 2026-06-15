import type { ModuleType } from "@/features/intelligence-control-plane/types";

export type AdminRole =
  | "SUPER_ADMIN"
  | "SYSTEM_ADMIN"
  | "SUPPORT_ENGINEER"
  | "READONLY_ANALYST";

export type AdminPermission =
  | "kill_switch:read"   | "kill_switch:write"
  | "replay:read"        | "replay:execute"     | "replay:force"
  | "dlq:read"           | "dlq:retry"          | "dlq:purge"
  | "budget:read"        | "budget:write"
  | "traces:read"
  | "system_control:read"| "system_control:write";

export type AdminUser = {
  id:        string;
  email:     string;
  role:      AdminRole;
  createdAt: string;
};

export type AdminActionType =
  | "kill_switch_activate"   | "kill_switch_deactivate"
  | "replay_trigger"         | "replay_force"
  | "dlq_retry"              | "dlq_purge"
  | "budget_read"            | "budget_update"
  | "policy_update"
  | "system_snapshot"        | "system_health_refresh";

export type AdminAction = {
  type:           AdminActionType;
  adminId:        string;
  targetModule:   ModuleType;
  targetEntityId: string;
  payload:        Record<string, unknown>;
  /** SUPER_ADMIN only: bypass idempotency guard on replay */
  force?:         boolean;
};

export type AdminAuditLog = {
  id:             string;
  adminId:        string;
  actionType:     AdminActionType;
  targetModule:   ModuleType;
  targetEntityId: string;
  phase:          "pre" | "post";
  result:         "success" | "blocked" | "error";
  details:        string;
  fingerprint:    string;
  timestamp:      string;
};

export type AdminError = {
  code:    string;
  message: string;
};

export type AdminCommandResult = {
  success:         boolean;
  action:          AdminAction;
  adminId:         string;
  timestamp:       string;
  durationMs:      number;
  affectedModules: string[];
  details:         string;
  auditId:         string;
  error?:          AdminError;
};

export type ModuleSnapshot = {
  module:       ModuleType;
  healthScore:  number;
  state:        string;
  dlqDepth:     number;
  failureRate:  number;
  avgLatencyMs: number;
  computedAt:   string;
};

export type SystemSnapshot = {
  globalScore:  number;
  modules:      ModuleSnapshot[];
  killSwitches: Record<string, string | null>;
  computedAt:   string;
};

export type AdminQueryFilter = {
  adminId?:    string;
  module?:     ModuleType;
  actionType?: AdminActionType;
  fromTs?:     string;
  toTs?:       string;
  limit?:      number;
};
