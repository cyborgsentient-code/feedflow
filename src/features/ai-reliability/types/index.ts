import type { AITaskType } from "@/features/ai-processing/types";

export type AIFailureCategory =
  | "validation_failure"
  | "timeout_failure"
  | "network_failure"
  | "provider_failure"
  | "budget_exceeded"
  | "duplicate_job"
  | "db_failure"
  | "unknown_failure";

export type AIHealthState = "healthy" | "degraded" | "unstable" | "critical";

export type AITrace = {
  jobId:           string;
  fingerprint:     string;
  taskType:        AITaskType;
  startedAt:       string;
  finishedAt:      string | null;
  durationMs:      number | null;
  status:          "running" | "completed" | "failed";
  failureCategory: AIFailureCategory | null;
  tokenEstimate:   number | null;
  costEstimate:    number | null;
};

export type AIDLQEntry = {
  jobId:           string;
  fingerprint:     string;
  userId:          string;
  taskType:        AITaskType;
  failureCategory: AIFailureCategory;
  errorMessage:    string;
  retryCount:      number;
  createdAt:       string;
};

export type AIMetrics = {
  totalJobs:         number;
  completedJobs:     number;
  failedJobs:        number;
  replayedJobs:      number;
  dlqEntries:        number;
  estimatedTokens:   number;
  estimatedCostUsd:  number;
  averageDurationMs: number;
  successRate:       number;
};

export type AIHealth = {
  metrics:     AIMetrics;
  healthScore: number;
  state:       AIHealthState;
};

export type AITokenEstimate = {
  estimatedInputTokens:  number;
  estimatedOutputTokens: number;
  estimatedTotalTokens:  number;
};

export type AICostEstimate = {
  modelId:          string;
  estimatedCostUsd: number;
};

export type AIBudget = {
  userId:               string;
  dailyBudgetUsd:       number;
  monthlyBudgetUsd:     number;
  dailyTokenLimit:      number;
  monthlyTokenLimit:    number;
  dailyUsageUsd:        number;
  monthlyUsageUsd:      number;
  dailyTokensUsed:      number;
  monthlyTokensUsed:    number;
};

export type AIModelCapability =
  | "summary" | "classification" | "entity_extraction" | "drafting" | "keywords" | "sentiment";

export type AIProvider = {
  id:              string;
  name:            string;
  supportedModels: string[];
};

export type AIModel = {
  id:              string;
  providerId:      string;
  contextWindow:   number;
  maxOutputTokens: number;
  capabilities:    AIModelCapability[];
  inputCostPer1k:  number;   // USD
  outputCostPer1k: number;   // USD
};

export type AIRouteDecision = {
  provider: string;
  model:    string;
  reason:   string;
};
