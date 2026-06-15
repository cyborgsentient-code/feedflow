import { supabase } from "@/lib/supabase";

export const budgetOps = {
  async inspect(userId: string) {
    const { data } = await supabase
      .from("ai_budgets")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return data ?? null;
  },

  /** BUDGET:WRITE — update budget limits only, never usage counters. */
  async updateLimits(userId: string, dailyBudgetUsd: number, monthlyBudgetUsd: number): Promise<void> {
    await supabase
      .from("ai_budgets")
      .upsert({ user_id: userId, daily_budget_usd: dailyBudgetUsd, monthly_budget_usd: monthlyBudgetUsd }, { onConflict: "user_id" });
  },
};
