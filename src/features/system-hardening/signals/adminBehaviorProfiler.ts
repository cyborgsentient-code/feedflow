import type { AdminRole } from "@/features/admin-console/types";

/**
 * Tracks rolling action counts per adminId.
 * Flags deviation from baseline distribution as anomaly score [0,1].
 *
 * Baseline: most actions should be read-heavy.
 * Anomaly: write-heavy or unusual burst from a normally read-only admin.
 */
const actionLog = new Map<string, { writes: number; total: number }>();

const WRITE_ACTIONS = new Set([
  "kill_switch_activate", "kill_switch_deactivate",
  "replay_trigger", "replay_force",
  "dlq_purge", "budget_update", "policy_update",
]);

// Expected write ratio per role (baseline)
const BASELINE_WRITE_RATIO: Record<string, number> = {
  SUPER_ADMIN:      0.4,
  SYSTEM_ADMIN:     0.3,
  SUPPORT_ENGINEER: 0.15,
  READONLY_ANALYST: 0.0,
};

export function profileAdminBehavior(adminId: string, role: AdminRole, actionType: string): number {
  const log   = actionLog.get(adminId) ?? { writes: 0, total: 0 };
  const isWrite = WRITE_ACTIONS.has(actionType);
  log.total++;
  if (isWrite) log.writes++;
  actionLog.set(adminId, log);

  const actualRatio   = log.total > 0 ? log.writes / log.total : 0;
  const baseline      = BASELINE_WRITE_RATIO[role] ?? 0.2;
  const deviation     = Math.max(0, actualRatio - baseline);

  // Normalize deviation: 100% excess → score 1
  return Math.min(1, deviation / Math.max(baseline, 0.05));
}
