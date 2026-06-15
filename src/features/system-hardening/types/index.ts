export type ThreatLevel = "none" | "low" | "medium" | "high" | "critical";

export type AnomalySignalName =
  | "rateAnomaly"
  | "replayAbuse"
  | "adminBehavior"
  | "budgetAnomaly"
  | "traceAnomaly";

export type AnomalyEvent = {
  id:         string;
  signal:     AnomalySignalName;
  userId:     string;
  module:     string;
  score:      number;          // 0–1
  detectedAt: string;
  metadata:   Record<string, unknown>;
};

export type AnomalyScore = {
  userId:     string;
  scores:     Record<AnomalySignalName, number>;  // 0–1 each
  riskScore:  number;                              // 0–100 composite
  level:      ThreatLevel;
  computedAt: string;
};

export type RiskSignal = {
  name:  AnomalySignalName;
  value: number;    // 0–1, already decayed
};

export type HardeningDecision = {
  action:           "allow" | "throttle" | "quarantine" | "block";
  riskScore:        number;
  triggeredSignals: string[];
  appliedPolicy?:   string;
  delayMs?:         number;
  reason?:          string;
};

export type AbusePattern = {
  patternId:   string;
  description: string;
  signal:      AnomalySignalName;
  threshold:   number;
};

export type ShieldMode = "OFF" | "THROTTLE_ONLY_MODE" | "READ_ONLY_MODE" | "GLOBAL_BLOCK";

export type HardeningRequest = {
  userId:     string;
  adminId?:   string;
  module:     string;
  action:     string;
  entityId?:  string;
  isReplay?:  boolean;
  isAdmin?:   boolean;
  metadata?:  Record<string, unknown>;
};
