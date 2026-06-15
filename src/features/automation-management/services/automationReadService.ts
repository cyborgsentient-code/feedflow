import { supabase } from "@/lib/supabase";
import type { Automation, Execution, AutomationResult } from "../types";
import { mapError } from "./automationErrors";

function rowToAutomation(row: Record<string, unknown>): Automation {
  return {
    id:            String(row.id),
    userId:        String(row.user_id),
    name:          String(row.job_type),           // job_type as display name until name column exists
    description:   String(row.error_message ?? ""),
    jobType:       row.job_type as Automation["jobType"],
    status:        jobStatusToAutomationStatus(String(row.status)),
    scheduleHours: typeof row.automation_frequency_hours === "number" ? row.automation_frequency_hours : 24,
    createdAt:     String(row.created_at),
    updatedAt:     String(row.scheduled_at ?? row.created_at),
  };
}

function jobStatusToAutomationStatus(status: string): Automation["status"] {
  if (status === "running" || status === "scheduled" || status === "pending") return "active";
  if (status === "cancelled") return "disabled";
  return "draft";
}

export const automationReadService = {
  async getAutomations(userId: string): Promise<AutomationResult<Automation[]>> {
    try {
      const { data, error } = await supabase
        .from("automation_jobs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { success: true, data: (data ?? []).map((r) => rowToAutomation(r as Record<string, unknown>)) };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  async getAutomation(id: string, userId: string): Promise<AutomationResult<Automation>> {
    try {
      const { data, error } = await supabase
        .from("automation_jobs")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)         // ownership enforced — never fetch by id alone
        .single();
      if (error) throw error;
      return { success: true, data: rowToAutomation(data as Record<string, unknown>) };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  async getExecutionHistory(automationId: string, userId: string): Promise<AutomationResult<Execution[]>> {
    try {
      const { data, error } = await supabase
        .from("automation_logs")
        .select("*")
        .eq("job_id", automationId)
        .eq("user_id", userId)         // defense-in-depth: ownership enforced at service layer
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return {
        success: true,
        data: (data ?? []).map((r) => ({
          id:           String(r.id),
          automationId: String(r.job_id ?? automationId),
          startedAt:    String(r.created_at),
          completedAt:  null,
          status:       "success" as const,
          result:       null,
        })),
      };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },
};
