/** Per-fingerprint replay counts and per-userId DLQ retry counts, with TTL reset. */
const WINDOW_MS    = 60 * 60 * 1000;   // 1-hour rolling window
const REPLAY_LIMIT = 5;
const DLQ_STORM    = 20;

type WindowedCount = { count: number; windowStart: number };
const replayCounts = new Map<string, WindowedCount>();
const dlqCounts    = new Map<string, WindowedCount>();

function windowedIncrement(map: Map<string, WindowedCount>, key: string): number {
  const now   = Date.now();
  const entry = map.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    map.set(key, { count: 1, windowStart: now });
    return 1;
  }
  entry.count++;
  return entry.count;
}

export function detectReplayAbuse(userId: string, fingerprint?: string): number {
  const dlq      = windowedIncrement(dlqCounts, userId);
  const dlqScore = Math.min(1, dlq / DLQ_STORM);

  let replayScore = 0;
  if (fingerprint) {
    const replays  = windowedIncrement(replayCounts, fingerprint);
    replayScore    = Math.min(1, replays / REPLAY_LIMIT);
  }

  return Math.max(replayScore, dlqScore);
}
