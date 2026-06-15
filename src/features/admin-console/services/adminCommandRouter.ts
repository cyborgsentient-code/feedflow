import type { AdminAction, AdminCommandResult, AdminError } from "../types";
import { adminAuthGuard }   from "../auth/adminAuthGuard";
import { auditLogger }      from "../audit/auditLogger";
import { killSwitchOps }    from "../operations/killSwitchOps";
import { replayOps }        from "../operations/replayOps";
import { dlqOps }           from "../operations/dlqOps";
import { budgetOps }        from "../operations/budgetOps";
import { systemControlOps } from "../operations/systemControlOps";
import type { KillSwitchRule } from "@/features/intelligence-control-plane/types";

/**
 * Single entry point for all admin write operations.
 * Flow: RBAC → pre-audit → execute → post-audit → return result with timing.
 */
export const adminCommandRouter = {
  async execute(action: AdminAction): Promise<AdminCommandResult> {
    const startMs    = Date.now();
    const timestamp  = new Date().toISOString();

    const base = {
      action,
      adminId:         action.adminId,
      timestamp,
      affectedModules: [action.targetModule],
    };

    // 1. RBAC
    const guard = await adminAuthGuard.check(action);
    if (!guard.allowed) {
      auditLogger.write(action, "pre", "blocked", guard.reason);
      return { ...base, success: false, durationMs: Date.now() - startMs,
        details: guard.reason, auditId: "", error: { code: "RBAC_DENIED", message: guard.reason } };
    }

    // 2. Pre-execution audit (non-blocking)
    const preAuditId = await auditLogger.write(action, "pre", "success", "Pre-execution check passed.");

    // 3. Execute
    let resultDetails: string;
    try {
      resultDetails = await dispatch(action);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      auditLogger.write(action, "post", "error", msg);
      return { ...base, success: false, durationMs: Date.now() - startMs,
        details: msg, auditId: preAuditId, error: { code: "EXECUTION_ERROR", message: msg } };
    }

    // 4. Post-execution audit (non-blocking)
    auditLogger.write(action, "post", "success", resultDetails);

    return { ...base, success: true, durationMs: Date.now() - startMs,
      details: resultDetails, auditId: preAuditId };
  },
};

async function dispatch(action: AdminAction): Promise<string> {
  switch (action.type) {
    case "kill_switch_activate":
      killSwitchOps.activate(action.payload.rule as KillSwitchRule);
      return `Kill switch activated on ${action.targetModule}.`;

    case "kill_switch_deactivate":
      killSwitchOps.deactivate(String(action.payload.ruleId));
      return `Kill switch rule removed: ${action.payload.ruleId}.`;

    case "replay_trigger":
    case "replay_force": {
      const res = await replayOps.trigger(
        action.targetModule,
        action.targetEntityId,
        String(action.payload.userId),
        action.adminId,
        action.force ?? false,
      );
      return `Replay: ${res.action}${res.details ? ` — ${res.details}` : ""}`;
    }

    case "dlq_retry":
      await dlqOps.retry(
        action.targetModule as "automation" | "execution" | "ai" | "intelligence",
        action.targetEntityId,
        String(action.payload.userId),
      );
      return `DLQ retry triggered for ${action.targetEntityId}.`;

    case "dlq_purge":
      await dlqOps.purge(
        action.targetModule as "automation" | "execution" | "ai" | "intelligence",
        action.targetEntityId,
        String(action.payload.userId),
      );
      return `DLQ entry purged: ${action.targetEntityId}.`;

    case "budget_read": {
      const data = await budgetOps.inspect(String(action.payload.userId));
      return data ? `Budget fetched for ${action.payload.userId}.` : "No budget record found.";
    }

    case "budget_update":
      await budgetOps.updateLimits(
        String(action.payload.userId),
        Number(action.payload.dailyBudgetUsd),
        Number(action.payload.monthlyBudgetUsd),
      );
      return `Budget updated for user ${action.payload.userId}.`;

    case "policy_update":
      systemControlOps.updatePolicy(
        action.payload.policy as Parameters<typeof systemControlOps.updatePolicy>[0],
      );
      return `Policy updated: ${(action.payload.policy as { id: string }).id}.`;

    case "system_snapshot":
      await systemControlOps.refreshHealth(action.adminId);
      return "System snapshot refreshed.";

    case "system_health_refresh": {
      const health = await systemControlOps.refreshHealth(action.adminId);
      return `Health refreshed. Global score: ${health.globalScore}.`;
    }

    default:
      throw new Error(`Unhandled action type: ${(action as AdminAction).type}`);
  }
}
