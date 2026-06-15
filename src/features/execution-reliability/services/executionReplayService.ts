import { supabase } from "@/lib/supabase";
import { actionExecutor } from "@/features/action-execution/services/actionExecutor";
import type { ActionExecution } from "@/features/action-execution/types";
import type { FailureCategory } from "../types";
import { executionDLQService } from "./executionDLQService";

export type ReplayMode = "execute" | "dry-run";

export type ReplayResult = {
  fingerprint: string;
  action:      "replayed" | "skipped_dry_run" | "skipped_already_completed";
};

export const executionReplayService = {
  async replayExecution(executionId: string, userId: string, mode: ReplayMode = "execute"): Promise<ReplayResult> {
    const entry = await findDLQByExecutionId(executionId, userId);
    if (!entry) return { fingerprint: executionId, action: "skipped_already_completed" };
    return requeue(entry.fingerprint, entry.actionType, userId, entry.executionId, mode);
  },

  async replayByCategory(category: FailureCategory, userId: string, mode: ReplayMode = "execute"): Promise<ReplayResult[]> {
    const entries = await executionDLQService.getDLQEntries(userId);
    return Promise.all(
      entries
        .filter((e) => e.failureCategory === category)
        .map((e) => requeue(e.fingerprint, e.actionType, userId, e.executionId, mode)),
    );
  },

  async replayAllFailed(userId: string, mode: ReplayMode = "execute"): Promise<ReplayResult[]> {
    const entries = await executionDLQService.getDLQEntries(userId);
    return Promise.all(entries.map((e) => requeue(e.fingerprint, e.actionType, userId, e.executionId, mode)));
  },

  async dryRunReplay(executionId: string, userId: string): Promise<ReplayResult> {
    return this.replayExecution(executionId, userId, "dry-run");
  },
};

async function findDLQByExecutionId(executionId: string, userId: string) {
  const { data } = await supabase
    .from("execution_dlq")
    .select("*")
    .eq("execution_id", executionId)
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? null;
}

async function requeue(
  fingerprint:  string,
  _actionType:  string,
  _userId:      string,
  executionId:  string,
  mode:         ReplayMode,
): Promise<ReplayResult> {
  if (mode === "dry-run") return { fingerprint, action: "skipped_dry_run" };

  // Fetch the original execution record to rebuild ActionExecution
  const { data } = await supabase
    .from("execution_results")
    .select("*")
    .eq("id", executionId)
    .maybeSingle();

  if (!data) return { fingerprint, action: "skipped_already_completed" };

  // Delete the existing execution_results row so idempotency check doesn't short-circuit
  await supabase.from("execution_results").delete().eq("id", executionId);

  const execution: ActionExecution = {
    automationEventId: String(data.automation_event_id),
    userId:            String(data.user_id),
    actionType:        data.action_type,
    payload:           (data.result_payload as ActionExecution["payload"]) ?? { action: data.action_type },
  };

  await actionExecutor.execute(execution);
  return { fingerprint, action: "replayed" };
}
