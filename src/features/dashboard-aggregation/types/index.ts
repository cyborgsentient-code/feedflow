import type { ModuleType } from "@/features/intelligence-control-plane/types";
import type { KillSwitchAction, PolicyRule } from "@/features/intelligence-control-plane/types";

export type DashboardSeverity = "info" | "warning" | "critical";

export type TimeWindow = "1m" | "5m" | "1h" | "24h" | "7d";

export type DashboardEvent = {
  id:        string;
  userId:    string;
  module:    ModuleType;
  type:      string;
  timestamp: string;
  entityId:  string;
  severity:  DashboardSeverity;
  metadata:  Record<string, unknown>;
};

export type DashboardMetric = {
  module:        ModuleType | "system";
  name:          string;
  value:         number;
  unit:          string;
  window:        TimeWindow;
  computedAt:    string;
};

export type DashboardWidget = {
  id:        string;
  type:      "chart" | "timeline" | "metric" | "heatmap";
  title:     string;
  data:      unknown;
  timeframe: TimeWindow;
  module?:   ModuleType;
};

export type ModuleSummary = {
  module:        ModuleType;
  totalEvents:   number;
  successCount:  number;
  failureCount:  number;
  successRate:   number;   // 0–1
  avgLatencyMs:  number;
  dlqDepth:      number;
  window:        TimeWindow;
};

export type CostSummary = {
  dailyUsd:      number;
  monthlyUsd:    number;
  budgetPct:     number;
  dailyTokens:   number;
};

export type ThroughputMetrics = {
  eventsPerSecond:    number;
  automationsPerMin:  number;
  executionsPerMin:   number;
  aiTasksPerMin:      number;
};

export type UserDashboardState = {
  userId:                  string;
  activityTimeline:        DashboardEvent[];
  feedSummary:             ModuleSummary;
  automationSummary:       ModuleSummary;
  executionSummary:        ModuleSummary;
  aiSummary:               ModuleSummary;
  personalizationSummary:  ModuleSummary;
  healthScore:             number;
  computedAt:              string;
};

export type SystemOverview = {
  globalHealthScore:       number;
  moduleHealthBreakdown:   Record<ModuleType, { score: number; state: string }>;
  topFailingModules:       ModuleType[];
  costSummary:             CostSummary;
  throughputMetrics:       ThroughputMetrics;
  killSwitchStatus:        Record<ModuleType, KillSwitchAction | null>;
  activePolicies:          PolicyRule[];
  computedAt:              string;
};

export type TraceFilter = {
  module?:     ModuleType;
  entityId?:   string;
  fromTs?:     string;
  toTs?:       string;
  failuresOnly?: boolean;
};
