import { killSwitchEngine } from "@/features/intelligence-control-plane/kill-switch/killSwitchEngine";
import { killSwitchState }  from "@/features/intelligence-control-plane/kill-switch/killSwitchState";
import type { KillSwitchRule, KillSwitchState } from "@/features/intelligence-control-plane/types";

export const killSwitchOps = {
  getState(): KillSwitchState {
    return killSwitchState.get();
  },

  activate(rule: KillSwitchRule): void {
    killSwitchEngine.addRule({ ...rule, enabled: true });
  },

  deactivate(ruleId: string): void {
    killSwitchEngine.removeRule(ruleId);
  },
};
