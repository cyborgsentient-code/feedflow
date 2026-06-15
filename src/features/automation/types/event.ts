/** Canonical event type for all FeedFlow automation/realtime events.
 *  All future realtime consumers MUST use this shape — no ad-hoc event objects. */

export type AutomationEventType = "like" | "view" | "search" | "visit" | "error";

export type AutomationEvent = {
  readonly id: string;
  readonly type: AutomationEventType;
  /** Unix ms — ALWAYS server-driven, never client-generated. */
  readonly timestamp: number;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly sessionId: string;
  /** Server-assigned sequence for gap detection and replay ordering. */
  readonly sequenceNumber?: number;
};

/** All stream failures must map to this — no raw error strings in UI. */
export type StreamFailure = {
  type:
    | "connection_failed"
    | "replay_failed"
    | "schema_invalid"
    | "gap_unrecoverable"
    | "network_error"
    | "validation_failed"
    | "sync_lost";
  recoverable: boolean;
  retryAfter?: number;
};

/**
 * Recovery state — the ONLY health signal the UI must consume.
 *
 * healthy     — active connection, no gaps, reconciliation clean
 * recovering  — replay in progress after gap or reconnect
 * degraded    — gap detected, replay not yet attempted or in flight
 * repaired    — replay succeeded, stream is consistent again
 * corrupted   — gap unrecoverable (replay failed or MAX_RECONNECTS hit)
 */
export type StreamRecoveryState =
  | "healthy"
  | "recovering"
  | "degraded"
  | "repaired"
  | "corrupted";

/** Tracks a single replay window request lifecycle. */
export type StreamReplayWindow = {
  fromSequence: number;
  toSequence: number;
  requestedAt: number;
  status: "idle" | "requesting" | "complete" | "failed";
};

/**
 * Single atomic source of truth for all stream consumers.
 * MUST NOT be partially updated — rebuilt atomically via rebuildSnapshot().
 */
export type StreamSnapshot = {
  recoveryState: StreamRecoveryState;
  lastEventId: string | null;
  lastEventTimestamp: number | null;
  eventCount: number;
  reconnectCount: number;
  gapDetected: boolean;
  replayWindow: StreamReplayWindow | null;
  failure: StreamFailure | null;
  /** ms since last event timestamp — used for stale detection. */
  snapshotAgeMs: number;
  /** True when snapshotAgeMs exceeds the stale threshold. UI shows read-only indicator. */
  isStale: boolean;
};
