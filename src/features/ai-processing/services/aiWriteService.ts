import { supabase } from "@/lib/supabase";
import type { AIJob, AIResult, AIJobResult } from "../types";
import { mapAIError } from "./aiErrors";

function rowToJob(r: Record<string, unknown>): AIJob {
  return {
    id:          String(r.id),
    userId:      String(r.user_id),
    contentId:   String(r.content_id),
    taskType:    r.task_type as AIJob["taskType"],
    fingerprint: String(r.fingerprint),
    status:      r.status as AIJob["status"],
    prompt:      String(r.prompt ?? ""),
    result:      r.result ? (r.result as AIResult) : null,
    createdAt:   String(r.created_at),
    completedAt: r.completed_at ? String(r.completed_at) : null,
  };
}

export const aiWriteService = {
  async createAIJob(
    job: Omit<AIJob, "id" | "createdAt" | "completedAt" | "result">,
  ): Promise<AIJobResult<AIJob>> {
    try {
      const { data, error } = await supabase
        .from("ai_jobs")
        .upsert(
          {
            user_id:     job.userId,
            content_id:  job.contentId,
            task_type:   job.taskType,
            fingerprint: job.fingerprint,
            status:      job.status,
            prompt:      job.prompt,
          },
          { onConflict: "fingerprint" },
        )
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: rowToJob(data as Record<string, unknown>) };
    } catch (e) {
      return { success: false, error: mapAIError(e) };
    }
  },

  async saveAIResult(fingerprint: string, userId: string, result: AIResult): Promise<AIJobResult> {
    try {
      const { error } = await supabase
        .from("ai_jobs")
        .update({ result, status: "completed", completed_at: new Date().toISOString() })
        .eq("fingerprint", fingerprint)
        .eq("user_id", userId);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: mapAIError(e) };
    }
  },

  async updateJobStatus(
    fingerprint: string,
    userId:      string,
    status:      AIJob["status"],
  ): Promise<AIJobResult> {
    try {
      const patch: Record<string, unknown> = { status };
      if (status === "completed" || status === "failed") patch.completed_at = new Date().toISOString();
      const { error } = await supabase
        .from("ai_jobs")
        .update(patch)
        .eq("fingerprint", fingerprint)
        .eq("user_id", userId);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: mapAIError(e) };
    }
  },
};
