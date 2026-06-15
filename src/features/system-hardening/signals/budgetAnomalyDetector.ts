import { supabase } from "@/lib/supabase";

/** Cache budget pct per userId with 10s TTL to keep hot path < 5ms. */
const cache = new Map<string, { pct: number; at: number }>();
const TTL = 10_000;

export async function detectBudgetAnomaly(userId: string): Promise<number> {
  const cached = cache.get(userId);
  if (cached && Date.now() - cached.at < TTL) {
    return cached.pct < 0.8 ? 0 : Math.min(1, (cached.pct - 0.8) / 0.2);
  }

  const { data } = await supabase
    .from("ai_budgets")
    .select("daily_usage_usd, daily_budget_usd")
    .eq("user_id", userId)
    .maybeSingle();

  const usagePct = data?.daily_budget_usd
    ? data.daily_usage_usd / data.daily_budget_usd
    : 0;

  cache.set(userId, { pct: usagePct, at: Date.now() });
  return usagePct < 0.8 ? 0 : Math.min(1, (usagePct - 0.8) / 0.2);
}
