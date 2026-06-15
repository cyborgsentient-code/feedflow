import type { ActionType } from "@/features/action-execution/types";

export type FailureCategory =
  | "validation_failure"
  | "duplicate_execution"
  | "timeout_failure"
  | "db_failure"
  | "network_failure"
  | "unknown_failure";

export type ExecutionTrace = {
  id:              string;
  executionId:     string;
  fingerprint:     string;
  actionType:      ActionType;
  status:          "success" | "failed";
  failureCategory: FailureCategory | null;
  startedAt:       string;
  finishedAt:      string | null;
  durationMs:      number | null;
  createdAt:       string;
};

export type ExecutionDLQEntry = {
  id:              string;
  fingerprint:     string;
  executionId:     string;
  actionType:      ActionType;
  userId:          string;
  failureCategory: FailureCategory;
  errorMessage:    string;
  retryCount:      number;
  createdAt:       string;
};

export type ExecutionMetrics = {
  successCount:    number;
  failedCount:     number;
  dlqCount:        number;
  avgDurationMs:   number;
  retryCount:      number;
};

export type HealthState = "healthy" | "degraded" | "unstable" | "critical";

export type ExecutionHealth = {
  metrics:     ExecutionMetrics;
  healthScore: number;
  state:       HealthState;
};
