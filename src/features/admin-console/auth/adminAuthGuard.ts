import type { AdminAction, AdminPermission } from "../types";
import { hasPermission } from "./permissionMatrix";
import { sessionValidator } from "./sessionValidator";

/** Maps an AdminAction type to the required permission. */
const ACTION_PERMISSION: Record<string, AdminPermission> = {
  kill_switch_activate:   "kill_switch:write",
  kill_switch_deactivate: "kill_switch:write",
  replay_trigger:         "replay:execute",
  replay_force:           "replay:force",
  dlq_retry:              "dlq:retry",
  dlq_purge:              "dlq:purge",
  budget_read:            "budget:read",
  budget_update:          "budget:write",
  policy_update:          "system_control:write",
  system_snapshot:        "system_control:read",
  system_health_refresh:  "system_control:read",
};

export type GuardResult =
  | { allowed: true;  adminEmail: string }
  | { allowed: false; reason: string };

export const adminAuthGuard = {
  async check(action: AdminAction): Promise<GuardResult> {
    const admin = await sessionValidator.validate(action.adminId);
    if (!admin) return { allowed: false, reason: "Admin session not found or expired." };

    const required = ACTION_PERMISSION[action.type];
    if (!required) return { allowed: false, reason: `Unknown action type: ${action.type}` };

    if (!hasPermission(admin.role, required)) {
      return { allowed: false, reason: `Role '${admin.role}' lacks permission '${required}'.` };
    }

    // force replay only allowed for SUPER_ADMIN
    if (action.force && admin.role !== "SUPER_ADMIN") {
      return { allowed: false, reason: "Force replay requires SUPER_ADMIN role." };
    }

    return { allowed: true, adminEmail: admin.email };
  },
};
