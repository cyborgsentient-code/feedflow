import { supabase } from "@/lib/supabase";
import type { PolicyRule, PolicyDecision, SystemEvent } from "../types";

export const fallbackRoutingPolicy = {
  async check(rule: PolicyRule, event: SystemEvent): Promise<PolicyDecision> {
    const { count } = await supabase
      .from("automation_queue")
      .select("id", { count: "exact", head: true })
      .eq("user_id", event.userId)
      .in("status", ["pending", "processing"]);

    const depth = count ?? 0;
    if (depth >= rule.limit) {
      return { allowed: false, reason: `Queue backpressure: depth ${depth} >= limit ${rule.limit}`, rule };
    }
    return { allowed: true };
  },
};
