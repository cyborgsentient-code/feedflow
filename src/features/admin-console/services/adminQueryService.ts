import { systemInspector }  from "../inspection/systemInspector";
import { userInspector }    from "../inspection/userInspector";
import { traceInspector }   from "../inspection/traceInspector";
import { moduleInspector }  from "../inspection/moduleInspector";
import { auditQueryService } from "../audit/auditQueryService";
import type { AdminQueryFilter } from "../types";
import type { ModuleType }       from "@/features/intelligence-control-plane/types";
import type { AdminTraceFilter } from "../inspection/traceInspector";

/** Read-only. No writes allowed here. */
export const adminQueryService = {
  systemSnapshot:   (adminId: string) => systemInspector.snapshot(adminId),
  userView:         (userId: string)  => userInspector.inspect(userId),
  moduleView:       (module: ModuleType, userId: string) => moduleInspector.inspect(module, userId),
  traces:           (filter: AdminTraceFilter) => traceInspector.query(filter),
  entityChain:      (entityId: string) => traceInspector.getEntityChain(entityId),
  auditLog:         (filter: AdminQueryFilter) => auditQueryService.query(filter),
};
