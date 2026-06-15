import type { AIMetrics } from "../types";

export const aiMetricsCollector = {
  totalJobs:         0,
  completedJobs:     0,
  failedJobs:        0,
  replayedJobs:      0,
  dlqEntries:        0,
  estimatedTokens:   0,
  estimatedCostUsd:  0,
  durations:         [] as number[],

  recordCompleted(durationMs: number, tokens: number, costUsd: number) {
    this.totalJobs++; this.completedJobs++;
    this.durations.push(durationMs);
    this.estimatedTokens  += tokens;
    this.estimatedCostUsd += costUsd;
  },
  recordFailed()   { this.totalJobs++; this.failedJobs++;  },
  recordReplayed() { this.replayedJobs++;                  },
  recordDLQ()      { this.dlqEntries++;                    },

  snapshot(): AIMetrics {
    const avg = this.durations.length
      ? Math.round(this.durations.reduce((a, b) => a + b, 0) / this.durations.length)
      : 0;
    return {
      totalJobs:         this.totalJobs,
      completedJobs:     this.completedJobs,
      failedJobs:        this.failedJobs,
      replayedJobs:      this.replayedJobs,
      dlqEntries:        this.dlqEntries,
      estimatedTokens:   this.estimatedTokens,
      estimatedCostUsd:  Math.round(this.estimatedCostUsd * 100_000) / 100_000,
      averageDurationMs: avg,
      successRate:       this.totalJobs > 0 ? this.completedJobs / this.totalJobs : 1,
    };
  },
};
