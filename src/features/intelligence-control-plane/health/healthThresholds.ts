export const HEALTH_THRESHOLDS = {
  healthy:  80,
  degraded: 60,
  unstable: 40,
  // below unstable = critical
} as const;

export const MODULE_WEIGHTS: Record<string, number> = {
  feed:         0.20,
  automation:   0.25,
  execution:    0.20,
  ai:           0.20,
  intelligence: 0.15,
};

export function scoreToState(score: number): "healthy" | "degraded" | "unstable" | "critical" {
  if (score >= HEALTH_THRESHOLDS.healthy)  return "healthy";
  if (score >= HEALTH_THRESHOLDS.degraded) return "degraded";
  if (score >= HEALTH_THRESHOLDS.unstable) return "unstable";
  return "critical";
}
