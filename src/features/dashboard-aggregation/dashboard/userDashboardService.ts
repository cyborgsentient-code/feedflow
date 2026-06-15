import type { UserDashboardState, TimeWindow } from "../types";
import { eventAggregator }     from "../aggregation/eventAggregator";
import { moduleSummaryBuilder } from "../aggregation/moduleSummaryBuilder";
import { controlPlaneSource }  from "../sources/controlPlaneSource";

export const userDashboardService = {
  async build(userId: string, window: TimeWindow = "1h"): Promise<UserDashboardState> {
    const [events, summaries, health] = await Promise.all([
      eventAggregator.getAllEvents(userId, window),
      moduleSummaryBuilder.buildAll(userId, window),
      controlPlaneSource.getHealth(userId),
    ]);

    return {
      userId,
      activityTimeline:       events,
      feedSummary:            summaries.feed,
      automationSummary:      summaries.automation,
      executionSummary:       summaries.execution,
      aiSummary:              summaries.ai,
      personalizationSummary: summaries.intelligence,
      healthScore:            health.globalScore,
      computedAt:             new Date().toISOString(),
    };
  },
};
