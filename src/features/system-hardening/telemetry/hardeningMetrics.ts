/** In-memory counters for hardening activity — reset per session. */
const counters = {
  allowed:     0,
  throttled:   0,
  quarantined: 0,
  blocked:     0,
};

export const hardeningMetrics = {
  record(action: "allow" | "throttle" | "quarantine" | "block"): void {
    const map = { allow: "allowed", throttle: "throttled", quarantine: "quarantined", block: "blocked" } as const;
    counters[map[action]]++;
  },

  snapshot() {
    return { ...counters, total: counters.allowed + counters.throttled + counters.quarantined + counters.blocked };
  },

  reset(): void {
    counters.allowed = counters.throttled = counters.quarantined = counters.blocked = 0;
  },
};
