import { supabase } from "@/lib/supabase";
import type { PolicyRule, PolicyDecision, SystemEvent } from "../types";

export const budgetPolicy = {
  async check(rule: PolicyRule, event: SystemEvent): Promise<PolicyDecision> {
    const { data } = await supabase
      .from("ai_budgets")
      .select("daily_usage_usd, daily_budget_usd")
      .eq("user_id", event.userId)
      .maybeSingle();

    if (!data || !data.daily_budget_usd) return { allowed: true };

    const pct = (data.daily_usage_usd / data.daily_budget_usd) * 100;
    if (pct >= rule.limit) {
      return { allowed: false, reason: `AI budget at ${Math.round(pct)}% (limit: ${rule.limit}%)`, rule };
    }
    return { allowed: true };
  },
};
