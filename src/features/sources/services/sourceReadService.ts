import { supabase } from "@/lib/supabase";
import type { Source, SourceResult } from "../types";
import { mapError } from "./sourceErrors";

function rowToSource(r: Record<string, unknown>): Source {
  return {
    id:        String(r.id),
    userId:    String(r.user_id),
    name:      String(r.name),
    platform:  r.platform as Source["platform"],
    status:    r.status as Source["status"],
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export const sourceReadService = {
  async getSources(userId: string): Promise<SourceResult<Source[]>> {
    try {
      const { data, error } = await supabase
        .from("sources")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { success: true, data: (data ?? []).map((r) => rowToSource(r as Record<string, unknown>)) };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  async getSource(id: string, userId: string): Promise<SourceResult<Source>> {
    try {
      const { data, error } = await supabase
        .from("sources")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)         // ownership enforced
        .single();
      if (error) throw error;
      return { success: true, data: rowToSource(data as Record<string, unknown>) };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },
};
