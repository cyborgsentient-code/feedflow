import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type {
  AutomationEvent,
  AutomationEventType,
  StreamFailure,
  StreamRecoveryState,
  StreamReplayWindow,
  StreamSnapshot,
} from "../types/event";

// ─── Constants ────────────────────────────────────────────────────────────────
type LifecycleState = "idle" | "connecting" | "syncing" | "active" | "degraded" | "failed";

const MAX_RECONNECTS = 3;
const BACKOFF_MS = [1000, 2000, 4000] as const;
const VALID_TYPES = new Set<AutomationEventType>(["like", "view", "search", "visit", "error"]);
const SEENKEYS_MAX = 10_000;
const SEENKEYS_EVICT = Math.floor(SEENKEYS_MAX * 0.2);   // evict oldest 20%
const BATCH_WINDOW_MS = 250;
const STALE_THRESHOLD_MS = 60_000;                        // 60s without event = stale
const STORM_WINDOW_MS = 10_000;                           // reconnect storm detection window
const STORM_THRESHOLD = 2;                                // >2 reconnects in window = storm

// ─── Lifecycle state machine ──────────────────────────────────────────────────
function nextLifecycle(cur: LifecycleState, sig: LifecycleState): LifecycleState {
  const allowed: Record<LifecycleState, LifecycleState[]> = {
    idle:       ["connecting"],
    connecting: ["syncing", "failed"],
    syncing:    ["active", "failed"],
    active:     ["degraded", "failed"],
    degraded:   ["connecting", "failed"],
    failed:     ["connecting"],
  };
  return allowed[cur]?.includes(sig) ? sig : cur;
}

// ─── Canonical ordering ───────────────────────────────────────────────────────
function canonicalSort(a: AutomationEvent, b: AutomationEvent): number {
  if (a.sequenceNumber !== undefined && b.sequenceNumber !== undefined) {
    return a.sequenceNumber - b.sequenceNumber;
  }
  return a.timestamp - b.timestamp;
}

// ─── seenKeys memory safety ───────────────────────────────────────────────────
function evictOldestKeys(set: Set<string>): void {
  if (set.size < SEENKEYS_MAX) return;
  let evicted = 0;
  for (const key of set) {
    set.delete(key);
    if (++evicted >= SEENKEYS_EVICT) break;
  }
}

// ─── Event normalizer ─────────────────────────────────────────────────────────
function normalizeEvent(raw: Record<string, unknown>): AutomationEvent | null {
  const type = raw.action_type as string;
  if (!VALID_TYPES.has(type as AutomationEventType)) return null;

  const rawId = String(raw.id ?? "").trim();
  const timestamp = raw.created_at ? Date.parse(String(raw.created_at)) : 0;
  if (!timestamp) return null;

  const payload = Object.freeze((raw.metadata as Record<string, unknown>) ?? {});
  const fingerprint = rawId || `${type}-${timestamp}-${JSON.stringify(payload)}`;
  const seq = typeof raw.sequence_number === "number" ? raw.sequence_number : undefined;

  return Object.freeze<AutomationEvent>({
    id: rawId || fingerprint,
    type: type as AutomationEventType,
    timestamp,
    payload,
    sessionId: String(raw.job_id ?? ""),
    ...(seq !== undefined ? { sequenceNumber: seq } : {}),
  });
}

// ─── Reconciliation ───────────────────────────────────────────────────────────
function reconcileStream(events: AutomationEvent[]): { events: AutomationEvent[]; gapDetected: boolean } {
  const seen = new Set<string>();
  const deduped: AutomationEvent[] = [];
  for (const e of events) {
    if (!seen.has(e.id)) { seen.add(e.id); deduped.push(e); }
  }
  deduped.sort(canonicalSort);

  let gapDetected = false;
  for (let i = 1; i < deduped.length; i++) {
    const prev = deduped[i - 1].sequenceNumber;
    const curr = deduped[i].sequenceNumber;
    if (prev !== undefined && curr !== undefined && curr > prev + 1) { gapDetected = true; break; }
  }
  return { events: deduped, gapDetected };
}

// ─── Atomic snapshot rebuild ──────────────────────────────────────────────────
function rebuildSnapshot(
  recoveryState: StreamRecoveryState,
  events: AutomationEvent[],       // newest-first display order
  reconnectCount: number,
  gapDetected: boolean,
  replayWindow: StreamReplayWindow | null,
  failure: StreamFailure | null,
): StreamSnapshot {
  const newest = events[0] ?? null;
  const snapshotAgeMs = newest ? Date.now() - newest.timestamp : 0;
  return Object.freeze<StreamSnapshot>({
    recoveryState,
    lastEventId: newest?.id ?? null,
    lastEventTimestamp: newest?.timestamp ?? null,
    eventCount: events.length,
    reconnectCount,
    gapDetected,
    replayWindow: replayWindow ? Object.freeze({ ...replayWindow }) : null,
    failure: failure ? Object.freeze({ ...failure }) : null,
    snapshotAgeMs,
    isStale: snapshotAgeMs > STALE_THRESHOLD_MS,
  });
}

// ─── Recovery state derivation ────────────────────────────────────────────────
function deriveRecoveryState(
  lifecycle: LifecycleState,
  gapDetected: boolean,
  replayWindow: StreamReplayWindow | null,
  failure: StreamFailure | null,
): StreamRecoveryState {
  if (lifecycle === "failed" || failure?.type === "gap_unrecoverable") return "corrupted";
  if (replayWindow?.status === "requesting") return "recovering";
  if (replayWindow?.status === "complete" && !gapDetected) return "repaired";
  if (gapDetected) return "degraded";
  if (lifecycle === "active" || lifecycle === "syncing") return "healthy";
  return "degraded";
}

export type { StreamSnapshot, StreamRecoveryState };

export type UseAutomationStreamResult = {
  events: AutomationEvent[];
  snapshot: StreamSnapshot;
};

export function useAutomationStream(userId: string | undefined, sessionKey = 0): UseAutomationStreamResult {
  const [events, setEvents] = useState<AutomationEvent[]>([]);
  const [lifecycle, setLifecycle] = useState<LifecycleState>("idle");
  const [reconnectCount, setReconnectCount] = useState(0);
  const [gapDetected, setGapDetected] = useState(false);
  const [replayWindow, setReplayWindow] = useState<StreamReplayWindow | null>(null);
  const [failure, setFailure] = useState<StreamFailure | null>(null);

  const seenKeys          = useRef(new Set<string>());
  const lastSeq           = useRef<number | null>(null);
  const channelRef        = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectRef      = useRef(0);
  const backoffTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replayInFlight    = useRef<number | null>(null);
  // Backpressure: pending batch buffer + flush timer
  const pendingBatch      = useRef<AutomationEvent[]>([]);
  const batchTimer        = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Reconnect storm detection: timestamps of recent reconnect attempts
  const reconnectTimes    = useRef<number[]>([]);
  // Storm cooldown: when set, reconnects are blocked until this time
  const stormCooldownUntil = useRef<number>(0);

  function transition(sig: LifecycleState) {
    setLifecycle((cur) => nextLifecycle(cur, sig));
  }

  function removeChannel() {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }

  // ─── Flush batched events into state ─────────────────────────────────────
  function flushBatch() {
    const batch = pendingBatch.current.splice(0);
    if (batch.length === 0) return;
    setEvents((prev) => {
      const { events: reconciled, gapDetected: gap } = reconcileStream([...prev, ...batch]);
      Promise.resolve().then(() => setGapDetected(gap));
      return reconciled;
    });
  }

  // ─── Hydration: resolve lastSeq from DB before subscribing ───────────────
  async function fetchLastSequence(uid: string): Promise<void> {
    try {
      const { data } = await supabase
        .from("automation_logs")
        .select("sequence_number")
        .eq("user_id", uid)
        .order("sequence_number", { ascending: false })
        .limit(1)
        .single();
      if (data && typeof data.sequence_number === "number") {
        lastSeq.current = data.sequence_number;
      }
    } catch {
      // Non-fatal: stream will operate without hydrated sequence
    }
  }

  // ─── Replay ───────────────────────────────────────────────────────────────
  const requestReplay = useCallback(async (
    uid: string,
    fromSequence: number,
  ): Promise<{ success: boolean; missingRange?: [number, number] }> => {
    if (replayInFlight.current === fromSequence) return { success: true };
    replayInFlight.current = fromSequence;

    setReplayWindow({ fromSequence, toSequence: 0, requestedAt: Date.now(), status: "requesting" });

    try {
      const { data, error } = await supabase
        .from("automation_logs")
        .select("*")
        .eq("user_id", uid)
        .gt("sequence_number", fromSequence)
        .order("sequence_number", { ascending: true });

      if (error) throw error;

      const replayed: AutomationEvent[] = [];
      for (const row of data ?? []) {
        const event = normalizeEvent(row as Record<string, unknown>);
        if (!event || seenKeys.current.has(event.id)) continue;
        evictOldestKeys(seenKeys.current);
        seenKeys.current.add(event.id);
        replayed.push(event);
      }

      const maxSeq = replayed.reduce(
        (m, e) => (e.sequenceNumber !== undefined && e.sequenceNumber > m ? e.sequenceNumber : m),
        fromSequence,
      );

      if (replayed.length > 0) {
        setEvents((prev) => {
          const { events: reconciled, gapDetected: gap } = reconcileStream([...replayed, ...prev]);
          Promise.resolve().then(() => setGapDetected(gap));
          return reconciled;
        });
        if (maxSeq > (lastSeq.current ?? -1)) lastSeq.current = maxSeq;
      }

      const toSeq = replayed.length > 0 ? maxSeq : fromSequence;
      setReplayWindow({ fromSequence, toSequence: toSeq, requestedAt: Date.now(), status: "complete" });
      replayInFlight.current = null;
      return { success: true };
    } catch {
      setReplayWindow((w) => w ? { ...w, status: "failed" } : null);
      setFailure({ type: "replay_failed", recoverable: false });
      transition("failed");
      replayInFlight.current = null;
      return { success: false, missingRange: [fromSequence, fromSequence] };
    }
  }, []);

  // ─── Reconnect storm detection + throttle ─────────────────────────────────
  function isStormDetected(): boolean {
    const now = Date.now();
    if (now < stormCooldownUntil.current) return true;
    // Prune old timestamps outside the detection window
    reconnectTimes.current = reconnectTimes.current.filter(t => now - t < STORM_WINDOW_MS);
    reconnectTimes.current.push(now);
    if (reconnectTimes.current.length > STORM_THRESHOLD) {
      stormCooldownUntil.current = now + (BACKOFF_MS[BACKOFF_MS.length - 1] * 2);
      return true;
    }
    return false;
  }

  function handleReconnect(uid: string) {
    removeChannel();

    if (isStormDetected()) {
      // Force degraded — no automatic retry until cooldown expires
      transition("degraded");
      const remaining = stormCooldownUntil.current - Date.now();
      backoffTimer.current = setTimeout(() => {
        reconnectRef.current = 0;
        openChannel(uid);
      }, Math.max(remaining, BACKOFF_MS[BACKOFF_MS.length - 1]));
      return;
    }

    if (reconnectRef.current >= MAX_RECONNECTS) {
      setFailure({ type: "connection_failed", recoverable: false });
      transition("failed");
      return;
    }
    const attempt = reconnectRef.current++;
    setReconnectCount(reconnectRef.current);
    transition("degraded");
    backoffTimer.current = setTimeout(() => openChannel(uid), BACKOFF_MS[attempt] ?? 4000);
  }

  // ─── Single event ingest with backpressure batching ───────────────────────
  function ingestEvent(raw: Record<string, unknown>, uid: string) {
    const event = normalizeEvent(raw);
    if (!event) return;
    if (seenKeys.current.has(event.id)) return;
    evictOldestKeys(seenKeys.current);
    seenKeys.current.add(event.id);

    if (event.sequenceNumber !== undefined && lastSeq.current !== null) {
      if (event.sequenceNumber > lastSeq.current + 1) {
        requestReplay(uid, lastSeq.current);
      }
    }
    if (event.sequenceNumber !== undefined) {
      lastSeq.current = event.sequenceNumber;
    }

    // Backpressure: buffer into batch, flush after BATCH_WINDOW_MS
    pendingBatch.current.push(event);
    if (!batchTimer.current) {
      batchTimer.current = setTimeout(() => {
        batchTimer.current = null;
        flushBatch();
      }, BATCH_WINDOW_MS);
    }
  }

  function openChannel(uid: string) {
    if (channelRef.current) return;
    transition("connecting");

    const channel = supabase
      .channel(`automation:${uid}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "automation_logs", filter: `user_id=eq.${uid}` },
        (payload) => ingestEvent(payload.new as Record<string, unknown>, uid),
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED") {
          reconnectRef.current = 0;
          setReconnectCount(0);
          setFailure(null);
          setReplayWindow(null);
          setGapDetected(false);
          replayInFlight.current = null;
          transition("syncing");
          Promise.resolve().then(() => transition("active"));
        } else if (s === "TIMED_OUT" || s === "CLOSED" || s === "CHANNEL_ERROR") {
          if (lastSeq.current !== null) requestReplay(uid, lastSeq.current);
          handleReconnect(uid);
        }
      });

    channelRef.current = channel;
  }

  useEffect(() => {
    if (!userId) { transition("idle"); return; }

    // Full reset for fresh subscription
    reconnectRef.current = 0;
    stormCooldownUntil.current = 0;
    reconnectTimes.current = [];
    seenKeys.current.clear();
    lastSeq.current = null;
    pendingBatch.current = [];
    setFailure(null);
    setGapDetected(false);
    setReplayWindow(null);
    setEvents([]);
    setReconnectCount(0);

    // Load existing events from DB first
    supabase
      .from("automation_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        const loaded: AutomationEvent[] = [];
        for (const row of data ?? []) {
          const e = normalizeEvent(row as Record<string, unknown>);
          if (e && !seenKeys.current.has(e.id)) {
            seenKeys.current.add(e.id);
            loaded.push(e);
          }
        }
        if (loaded.length > 0) setEvents(loaded);
      });

    // Then subscribe for realtime updates
    fetchLastSequence(userId).then(() => openChannel(userId));

    return () => {
      if (backoffTimer.current) clearTimeout(backoffTimer.current);
      if (batchTimer.current) { clearTimeout(batchTimer.current); flushBatch(); }
      removeChannel();
    };
  }, [userId, sessionKey]);

  const recoveryState = deriveRecoveryState(lifecycle, gapDetected, replayWindow, failure);
  const displayEvents = useMemo(() => [...events].reverse(), [events]);

  const snapshot = rebuildSnapshot(
    recoveryState, displayEvents,
    reconnectCount, gapDetected, replayWindow, failure,
  );

  return { events: displayEvents, snapshot };
}
