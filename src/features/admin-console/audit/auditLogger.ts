import { supabase } from "@/lib/supabase";
import type { AdminAuditLog, AdminAction } from "../types";
import { auditFingerprint } from "./auditFingerprint";

let _seq = 0;

export const auditLogger = {
  /**
   * Append-only write. Best-effort async — never throws to caller.
   * Returns the generated audit log id.
   */
  async write(
    action:  AdminAction,
    phase:   AdminAuditLog["phase"],
    result:  AdminAuditLog["result"],
    details: string,
  ): Promise<string> {
    const timestamp = new Date().toISOString();
    const id        = `audit-${Date.now()}-${++_seq}`;
    const fp        = await auditFingerprint(action.type, action.adminId, timestamp);

    const entry: Omit<AdminAuditLog, never> = {
      id,
      adminId:        action.adminId,
      actionType:     action.type,
      targetModule:   action.targetModule,
      targetEntityId: action.targetEntityId,
      phase,
      result,
      details,
      fingerprint:    fp,
      timestamp,
    };

    // Fire-and-forget insert — immutable, never update
    supabase.from("admin_audit_logs").insert({
      id:               entry.id,
      admin_id:         entry.adminId,
      action_type:      entry.actionType,
      target_module:    entry.targetModule,
      target_entity_id: entry.targetEntityId,
      phase:            entry.phase,
      result:           entry.result,
      details:          entry.details,
      fingerprint:      entry.fingerprint,
      timestamp:        entry.timestamp,
    }).then(() => {}).catch(() => {});

    return id;
  },
};
