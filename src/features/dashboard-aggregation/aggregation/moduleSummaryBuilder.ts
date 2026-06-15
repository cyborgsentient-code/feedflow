import type { ModuleSummary, TimeWindow } from "../types";
import type { ModuleType } from "@/features/intelligence-control-plane/types";
import { feedSource }         from "../sources/feedSource";
import { automationSource }   from "../sources/automationSource";
import { executionSource }    from "../sources/executionSource";
import { aiSource }           from "../sources/aiSource";
import { intelligenceSource } from "../sources/intelligenceSource";

export const moduleSummaryBuilder = {
  async buildAll(userId: string, window: TimeWindow): Promise<Record<ModuleType, ModuleSummary>> {
    const [feed, automation, execution, ai, intelligence] = await Promise.all([
      feedSource.getSummary(userId, window),
      automationSource.getSummary(userId, window),
      executionSource.getSummary(userId, window),
      aiSource.getSummary(userId, window),
      intelligenceSource.getSummary(userId, window),
    ]);
    return { feed, automation, execution, ai, intelligence };
  },

  async build(userId: string, module: ModuleType, window: TimeWindow): Promise<ModuleSummary> {
    const map: Record<ModuleType, () => Promise<ModuleSummary>> = {
      feed:         () => feedSource.getSummary(userId, window),
      automation:   () => automationSource.getSummary(userId, window),
      execution:    () => executionSource.getSummary(userId, window),
      ai:           () => aiSource.getSummary(userId, window),
      intelligence: () => intelligenceSource.getSummary(userId, window),
    };
    return map[module]();
  },
};
