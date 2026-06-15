import { controlPlaneService } from "@/features/intelligence-control-plane/services/controlPlaneService";
import { policyEngine }        from "@/features/intelligence-control-plane/policies/policyEngine";
import type { PolicyRule, KillSwitchRule } from "@/features/intelligence-control-plane/types";

export const systemControlOps = {
  async refreshHealth(userId: string) {
    return controlPlaneService.refreshHealth(userId);
  },

  updatePolicy(policy: PolicyRule): void {
    policyEngine.upsertPolicy(policy);
  },

  activateKillSwitchRule(rule: KillSwitchRule): void {
    controlPlaneService.dispatch({ type: "activate_kill_switch", rule }, "admin");
  },

  deactivateKillSwitchRule(ruleId: string): void {
    controlPlaneService.dispatch({ type: "deactivate_kill_switch", ruleId }, "admin");
  },
};
