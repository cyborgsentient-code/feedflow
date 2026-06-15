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

export const aiReadService = {
  async getAIJob(id: string, userId: string): Promise<AIJobResult<AIJob>> {
    try {
      const { data, error } = await supabase
        .from("ai_jobs")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();
      if (error) throw error;
      return { success: true, data: rowToJob(data as Record<string, unknown>) };
    } catch (e) {
      return { success: false, error: mapAIError(e) };
    }
  },

  async getAIResultByFingerprint(fingerprint: string, userId: string): Promise<AIJobResult<AIJob>> {
    try {
      const { data, error } = await supabase
        .from("ai_jobs")
        .select("*")
        .eq("fingerprint", fingerprint)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { success: false, error: { code: "job_not_found", message: "AI job not found." } };
      return { success: true, data: rowToJob(data as Record<string, unknown>) };
    } catch (e) {
      return { success: false, error: mapAIError(e) };
    }
  },

  async getAIResult(id: string, userId: string): Promise<AIJobResult<AIResult>> {
    const job = await this.getAIJob(id, userId);
    if (!job.success) return job;
    if (!job.data.result) return { success: false, error: { code: "job_not_found", message: "Result not ready." } };
    return { success: true, data: job.data.result };
  },

  async getUserResults(userId: string): Promise<AIJobResult<AIJob[]>> {
    try {
      const { data, error } = await supabase
        .from("ai_jobs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return { success: true, data: (data ?? []).map((r) => rowToJob(r as Record<string, unknown>)) };
    } catch (e) {
      return { success: false, error: mapAIError(e) };
    }
  },
};
