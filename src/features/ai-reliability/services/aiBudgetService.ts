import { supabase } from "@/lib/supabase";
import type { AIBudget } from "../types";

const DEFAULTS: Omit<AIBudget, "userId" | "dailyUsageUsd" | "monthlyUsageUsd" | "dailyTokensUsed" | "monthlyTokensUsed"> = {
  dailyBudgetUsd:    1.00,
  monthlyBudgetUsd:  20.00,
  dailyTokenLimit:   100_000,
  monthlyTokenLimit: 2_000_000,
};

export const aiBudgetService = {
  async getUserBudget(userId: string): Promise<AIBudget> {
    const { data } = await supabase.from("ai_budgets").select("*").eq("user_id", userId).maybeSingle();
    return {
      userId,
      dailyBudgetUsd:    data?.daily_budget_usd    ?? DEFAULTS.dailyBudgetUsd,
      monthlyBudgetUsd:  data?.monthly_budget_usd  ?? DEFAULTS.monthlyBudgetUsd,
      dailyTokenLimit:   data?.daily_token_limit   ?? DEFAULTS.dailyTokenLimit,
      monthlyTokenLimit: data?.monthly_token_limit ?? DEFAULTS.monthlyTokenLimit,
      dailyUsageUsd:     data?.daily_usage_usd     ?? 0,
      monthlyUsageUsd:   data?.monthly_usage_usd   ?? 0,
      dailyTokensUsed:   data?.daily_tokens_used   ?? 0,
      monthlyTokensUsed: data?.monthly_tokens_used ?? 0,
    };
  },

  checkBudget(budget: AIBudget, costUsd: number, tokens: number): "ok" | "daily_exceeded" | "monthly_exceeded" | "token_limit" {
    if (budget.dailyUsageUsd   + costUsd > budget.dailyBudgetUsd)     return "daily_exceeded";
    if (budget.monthlyUsageUsd + costUsd > budget.monthlyBudgetUsd)   return "monthly_exceeded";
    if (budget.dailyTokensUsed + tokens  > budget.dailyTokenLimit)    return "token_limit";
    if (budget.monthlyTokensUsed + tokens > budget.monthlyTokenLimit) return "token_limit";
    return "ok";
  },

  async recordUsage(userId: string, costUsd: number, tokens: number): Promise<void> {
    await supabase.rpc("increment_ai_budget_usage", { p_user_id: userId, p_cost_usd: costUsd, p_tokens: tokens });
  },
};
