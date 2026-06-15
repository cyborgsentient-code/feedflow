import type { AnomalyEvent } from "../types";
import { systemEventRouter } from "@/features/intelligence-control-plane/services/systemEventRouter";

/** Forward anomaly events into Module 14's trace system as system events. */
export const anomalyTraceCollector = {
  write(event: AnomalyEvent): void {
    // Fire-and-forget — never block the request path
    systemEventRouter.emit({
      module:    "intelligence",
      type:      "profile_updated",   // closest semantic match in existing event type union
      userId:    event.userId,
      entityId:  event.userId,
      timestamp: event.detectedAt,
      metadata:  { signal: event.signal, score: event.score, ...event.metadata },
    });
  },
};
