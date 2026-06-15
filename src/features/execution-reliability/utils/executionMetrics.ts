// Pure counters — no logging framework
export const executionMetrics = {
  attempted: 0,
  succeeded: 0,
  failed:    0,
  retried:   0,
  timedOut:  0,
  dlqWrites: 0,

  recordAttempt()  { this.attempted++; },
  recordSuccess()  { this.succeeded++; },
  recordFailure()  { this.failed++;    },
  recordRetry()    { this.retried++;   },
  recordTimeout()  { this.timedOut++;  },
  recordDLQWrite() { this.dlqWrites++; },

  snapshot() {
    return {
      attempted: this.attempted,
      succeeded: this.succeeded,
      failed:    this.failed,
      retried:   this.retried,
      timedOut:  this.timedOut,
      dlqWrites: this.dlqWrites,
      successRate: this.attempted > 0 ? this.succeeded / this.attempted : 1,
    };
  },
};
