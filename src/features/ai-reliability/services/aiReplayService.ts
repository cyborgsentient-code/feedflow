import { supabase } from "@/lib/supabase";
import { aiPipeline } from "@/features/ai-processing/services/aiPipeline";
import type { AITask } from "@/features/ai-processing/types";
import type { AIFailureCategory } from "../types";
import { aiDLQService } from "./aiDLQService";

export type ReplayMode = "execute" | "dry-run";
export type ReplayResult = { fingerprint: string; action: "replayed" | "skipped_dry_run" | "not_found" };

export const aiReplayService = {
  async replayJob(fingerprint: string, userId: string, mode: ReplayMode = "execute"): Promise<ReplayResult> {
    if (mode === "dry-run") return { fingerprint, action: "skipped_dry_run" };

    // Restore from DLQ to rebuild the task
    const entry = await aiDLQService.getDLQEntry(fingerprint, userId);
    if (!entry) return { fingerprint, action: "not_found" };

    // Reset job status so pipeline doesn't short-circuit on "failed"
    await supabase.from("ai_jobs").update({ status: "queued" }).eq("fingerprint", fingerprint).eq("user_id", userId);

    // Fetch original job payload
    const { data } = await supabase.from("ai_jobs").select("*").eq("fingerprint", fingerprint).eq("user_id", userId).maybeSingle();
    if (!data) return { fingerprint, action: "not_found" };

    const task: AITask = {
      taskType: data.task_type,
      payload:  { contentId: data.content_id, contentFingerprint: fingerprint, contentText: data.prompt ?? "", userId },
    };
    await aiPipeline.runAITask(task);
    return { fingerprint, action: "replayed" };
  },

  async replayByCategory(category: AIFailureCategory, userId: string, mode: ReplayMode = "execute"): Promise<ReplayResult[]> {
    const entries = (await aiDLQService.getDLQEntries(userId)).filter((e) => e.failureCategory === category);
    return Promise.all(entries.map((e) => this.replayJob(e.fingerprint, userId, mode)));
  },

  async replayAllFailed(userId: string, mode: ReplayMode = "execute"): Promise<ReplayResult[]> {
    const entries = await aiDLQService.getDLQEntries(userId);
    return Promise.all(entries.map((e) => this.replayJob(e.fingerprint, userId, mode)));
  },

  async dryRunReplay(fingerprint: string, userId: string): Promise<ReplayResult> {
    return this.replayJob(fingerprint, userId, "dry-run");
  },
};
