import { supabase } from "@/lib/supabase";

const DLQ_TABLES = {
  automation:   "automation_dlq",
  execution:    "execution_dlq",
  ai:           "ai_dlq",
  intelligence: "profile_dlq",
} as const;

type DLQModule = keyof typeof DLQ_TABLES;

export const dlqOps = {
  async inspect(module: DLQModule, userId: string) {
    const table = DLQ_TABLES[module];
    const { data } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .order("last_attempt_at", { ascending: false })
      .limit(100);
    return data ?? [];
  },

  /** Trigger retry via each module's own replay service (dynamic import, no circular dep). */
  async retry(module: DLQModule, entityId: string, userId: string): Promise<void> {
    switch (module) {
      case "automation": {
        const { replayService } = await import("@/features/automation-recovery/services/replayService");
        await replayService.replayJob(entityId, userId);
        break;
      }
      case "execution": {
        const { executionReplayService } = await import("@/features/execution-reliability/services/executionReplayService");
        await executionReplayService.replayExecution(entityId, userId);
        break;
      }
      case "ai": {
        const { aiReplayService } = await import("@/features/ai-reliability/services/aiReplayService");
        await aiReplayService.replayJob(entityId, userId);
        break;
      }
      case "intelligence": {
        const { profileRebuilder } = await import("@/features/user-intelligence/reliability/profileRebuilder");
        await profileRebuilder.replayForUser(userId);
        break;
      }
    }
  },

  /** SUPER_ADMIN only — hard delete a DLQ entry. */
  async purge(module: DLQModule, entityId: string, userId: string): Promise<void> {
    const table = DLQ_TABLES[module];
    await supabase.from(table).delete().eq("user_id", userId).eq("id", entityId);
  },
};
