import { userDashboardService } from "@/features/dashboard-aggregation/dashboard/userDashboardService";
import { traceQueryService }    from "@/features/intelligence-control-plane/tracing/traceQueryService";
import { dlqOps }               from "../operations/dlqOps";

export const userInspector = {
  /** Full cross-module timeline: dashboard state + traces + DLQ status. */
  async inspect(targetUserId: string) {
    const [dashboardState, traces, autoDlq, execDlq, aiDlq, intelDlq] = await Promise.all([
      userDashboardService.build(targetUserId, "24h"),
      traceQueryService.getUserTimeline(targetUserId),
      dlqOps.inspect("automation",   targetUserId),
      dlqOps.inspect("execution",    targetUserId),
      dlqOps.inspect("ai",           targetUserId),
      dlqOps.inspect("intelligence", targetUserId),
    ]);

    return {
      userId:         targetUserId,
      dashboardState,
      traces,
      dlq: {
        automation:   autoDlq,
        execution:    execDlq,
        ai:           aiDlq,
        intelligence: intelDlq,
      },
    };
  },
};
