export type FailureCategory =
  | "network_failure"
  | "rule_evaluation_failure"
  | "db_timeout_failure"
  | "lock_acquisition_failure"
  | "duplicate_event"
  | "unknown_failure";

export type JobTrace = {
  traceId:         string;
  jobId:           string;
  userId:          string;
  contentId:       string;
  ruleId:          string;
  workerId:        string;
  startTime:       string;
  endTime:         string | null;
  durationMs:      number | null;
  status:          "running" | "success" | "failed";
  failureCategory: FailureCategory | null;
};

export type QueueMetrics = {
  queueDepth:              number;
  jobsProcessedPerMinute:  number;
  jobsFailedPerMinute:     number;
  retryRate:               number;      // avg retries per job
  dlqGrowthRate:           number;      // new DLQ entries / min
  workerBatchLatencyMs:    number;      // avg
  skipLockedEfficiency:    number;      // claimed / (claimed + skipped), 0–1
};

export type HealthState = "healthy" | "degraded" | "unstable" | "critical";

export type QueueHealth = {
  stuckJobsCount:   number;
  retryPressure:    number;
  backlogAgeMs:     number;
  workerEfficiency: number;   // success / (success + fail), 0–1
  healthScore:      number;   // 0–100
  state:            HealthState;
};

export type DLQEntry = {
  fingerprint:       string;
  userId:            string;
  contentId:         string;
  ruleId:            string;
  failureCategory:   FailureCategory;
  failureReason:     string;
  lastWorkerId:      string | null;
  lastErrorSnapshot: string;
  payload:           Record<string, unknown>;
  retryCount:        number;
  lastAttemptAt:     string;
  createdAt:         string;
};
