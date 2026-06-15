import type { AdminRole, AdminPermission } from "../types";

export const PERMISSION_MATRIX: Record<AdminRole, AdminPermission[]> = {
  SUPER_ADMIN: [
    "kill_switch:read", "kill_switch:write",
    "replay:read", "replay:execute", "replay:force",
    "dlq:read", "dlq:retry", "dlq:purge",
    "budget:read", "budget:write",
    "traces:read",
    "system_control:read", "system_control:write",
  ],
  SYSTEM_ADMIN: [
    "kill_switch:read", "kill_switch:write",
    "replay:read", "replay:execute",
    "dlq:read", "dlq:retry",
    "budget:read",
    "traces:read",
    "system_control:read", "system_control:write",
  ],
  SUPPORT_ENGINEER: [
    "kill_switch:read",
    "replay:read", "replay:execute",
    "dlq:read", "dlq:retry",
    "budget:read",
    "traces:read",
    "system_control:read",
  ],
  READONLY_ANALYST: [
    "kill_switch:read",
    "replay:read",
    "dlq:read",
    "budget:read",
    "traces:read",
    "system_control:read",
  ],
};

export function hasPermission(role: AdminRole, permission: AdminPermission): boolean {
  return PERMISSION_MATRIX[role].includes(permission);
}
