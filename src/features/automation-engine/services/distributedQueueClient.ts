/**
 * Thin client adapter — triggers a worker invocation from the mobile client.
 * Used when the client wants to request immediate processing (e.g. on app foreground).
 * Workers also run on a schedule independently; this is an optional accelerator.
 */
import { supabase } from "@/lib/supabase";

export async function requestWorkerRun(): Promise<void> {
  await supabase.functions.invoke("automation-worker", {
    headers: { "x-worker-id": `client-${Date.now()}` },
  });
  // Response is informational only — do not throw on failure
}

export async function getQueueStats(userId: string): Promise<{
  pending: number; processing: number; failed: number; dead: number;
}> {
  const { data } = await supabase
    .from("automation_queue")
    .select("status")
    .eq("user_id", userId);

  const rows = data ?? [];
  return {
    pending:    rows.filter((r) => r.status === "pending").length,
    processing: rows.filter((r) => r.status === "processing").length,
    failed:     rows.filter((r) => r.status === "failed").length,
    dead:       rows.filter((r) => r.status === "dead").length,
  };
}
