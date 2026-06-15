/**
 * Client queue — enqueue only.
 * All processing, retry, and DLQ logic lives server-side (Edge Function worker).
 */
import { supabase } from "@/lib/supabase";
import type { EnqueuePayload } from "../types/distributed";

export async function enqueueToRemoteQueue(job: EnqueuePayload): Promise<void> {
  const { error } = await supabase
    .from("automation_queue")
    .insert({
      user_id:    job.userId,
      content_id: job.contentId,
      rule_id:    job.ruleId,
      fingerprint: job.fingerprint,
      status:     "pending",
      payload:    {
        rankScore:       job.rankScore,
        matchedKeywords: job.matchedKeywords,
        sourceId:        job.sourceId,
        sequenceNumber:  job.sequenceNumber,
        createdAt:       job.createdAt,
      },
    });

  // Unique constraint on fingerprint silently absorbs duplicate inserts —
  // the DB error code 23505 means the job is already queued; treat as success.
  if (error && !error.code?.includes("23505")) throw error;
}
