import { supabase } from "@/lib/supabase";
import type { AutomationResult } from "../types";
import type { AutomationCreateValues, AutomationUpdateValues } from "../validators";
import { mapError } from "./automationErrors";

export const automationWriteService = {
  async createAutomation(userId: string, values: AutomationCreateValues): Promise<AutomationResult<{ id: string }>> {
    try {
      const { data, error } = await supabase
        .from("automation_jobs")
        .insert({
          user_id:      userId,
          job_type:     "preference_sync",
          status:       "pending",
          priority:     1,
          scheduled_at: new Date().toISOString(),
          payload:      { name: values.name, description: values.description },
          result:       {},
          attempt_count: 0,
        })
        .select("id")
        .single();
      if (error) throw error;
      return { success: true, data: { id: String(data.id) } };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  async updateAutomation(id: string, userId: string, values: AutomationUpdateValues): Promise<AutomationResult> {
    try {
      const patch: Record<string, unknown> = {};
      if (values.scheduleHours !== undefined) patch.priority = values.scheduleHours;
      if (values.status !== undefined) {
        patch.status = values.status === "active"   ? "scheduled"
                     : values.status === "disabled" ? "cancelled"
                     :                                "pending";
      }
      const { error } = await supabase
        .from("automation_jobs")
        .update(patch)
        .eq("id", id)
        .eq("user_id", userId);       // ownership enforced
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  async toggleAutomation(id: string, userId: string, enable: boolean): Promise<AutomationResult> {
    try {
      const { error } = await supabase
        .from("automation_jobs")
        .update({ status: enable ? "scheduled" : "cancelled" })
        .eq("id", id)
        .eq("user_id", userId);       // ownership enforced
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  async deleteAutomation(id: string, userId: string): Promise<AutomationResult> {
    try {
      const { error } = await supabase
        .from("automation_jobs")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);       // ownership enforced
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },
};
