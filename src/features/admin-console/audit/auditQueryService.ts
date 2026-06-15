import { supabase } from "@/lib/supabase";
import type { AdminAuditLog, AdminQueryFilter } from "../types";

export const auditQueryService = {
  async query(filter: AdminQueryFilter): Promise<AdminAuditLog[]> {
    let q = supabase
      .from("admin_audit_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(filter.limit ?? 100);

    if (filter.adminId)    q = q.eq("admin_id",     filter.adminId);
    if (filter.module)     q = q.eq("target_module", filter.module);
    if (filter.actionType) q = q.eq("action_type",  filter.actionType);
    if (filter.fromTs)     q = q.gte("timestamp",   filter.fromTs);
    if (filter.toTs)       q = q.lte("timestamp",   filter.toTs);

    const { data } = await q;
    return (data ?? []).map((r) => ({
      id:             String(r.id),
      adminId:        String(r.admin_id),
      actionType:     r.action_type as AdminAuditLog["actionType"],
      targetModule:   r.target_module as AdminAuditLog["targetModule"],
      targetEntityId: String(r.target_entity_id),
      phase:          r.phase as AdminAuditLog["phase"],
      result:         r.result as AdminAuditLog["result"],
      details:        String(r.details),
      fingerprint:    String(r.fingerprint),
      timestamp:      String(r.timestamp),
    }));
  },
};
