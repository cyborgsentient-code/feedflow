import { supabase } from "@/lib/supabase";
import type { AutomationEvent } from "../types";
import { enqueue } from "./executionQueue";

/**
 * All replay functions are idempotent:
 * executionQueue.seen rejects already-processed fingerprints,
 * and emitAutomationEvent uses upsert(onConflict: "fingerprint").
 */

export const engineRecovery = {
  /** Replay all DLQ entries for a user — re-enqueues for dispatch. */
  async replayFailedEvents(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from("automation_dlq")
      .select("payload, retry_count")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(100);
    if (error || !data) return;

    for (const row of data) {
      const event = row.payload as AutomationEvent;
      event.status = "queued";
      enqueue(event); // seen-set deduplicates if already processed
    }
  },

  /** Re-enqueue all DLQ entries that haven't exceeded max retries. */
  async reconcileDLQ(): Promise<void> {
    const { data, error } = await supabase
      .from("automation_dlq")
      .select("payload, retry_count")
      .lt("retry_count", 3)
      .order("last_attempt_at", { ascending: true })
      .limit(200);
    if (error || !data) return;

    for (const row of data) {
      const event = row.payload as AutomationEvent;
      event.status = "queued";
      enqueue(event);
    }
  },

  /** Replay a fingerprint range (e.g. for a time-window re-run). */
  async reprocessFingerprintRange(min: string, max: string): Promise<void> {
    const { data, error } = await supabase
      .from("automation_dlq")
      .select("payload")
      .gte("fingerprint", min)
      .lte("fingerprint", max)
      .limit(500);
    if (error || !data) return;

    for (const row of data) {
      const event = row.payload as AutomationEvent;
      event.status = "queued";
      enqueue(event); // idempotent via seen-set
    }
  },
};
