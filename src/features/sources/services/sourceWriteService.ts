import { supabase } from "@/lib/supabase";
import type { SourceResult, SourceStatus } from "../types";
import type { SourceCreateValues } from "../validators";
import { mapError } from "./sourceErrors";

export const sourceWriteService = {
  async createSource(userId: string, values: SourceCreateValues): Promise<SourceResult<{ id: string }>> {
    try {
      const { data, error } = await supabase
        .from("sources")
        .insert({
          user_id:  userId,
          name:     values.name,
          platform: values.platform,
          status:   "active",
        })
        .select("id")
        .single();
      if (error) throw error;
      return { success: true, data: { id: String(data.id) } };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  async setSourceStatus(id: string, userId: string, status: SourceStatus): Promise<SourceResult> {
    try {
      const { error } = await supabase
        .from("sources")
        .update({ status })
        .eq("id", id)
        .eq("user_id", userId);        // ownership enforced
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  async deleteSource(id: string, userId: string): Promise<SourceResult> {
    try {
      const { error } = await supabase
        .from("sources")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);        // ownership enforced
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },
};
