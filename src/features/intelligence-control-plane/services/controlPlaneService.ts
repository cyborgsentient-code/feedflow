import type { ControlCommand, ReplayRequest } from "../types";
import { systemHealthAggregator } from "../health/systemHealthAggregator";
import { killSwitchEngine } from "../kill-switch/killSwitchEngine";
import { killSwitchState } from "../kill-switch/killSwitchState";
import { policyEngine } from "../policies/policyEngine";
import { systemReplayService } from "../replay/systemReplayService";

export const controlPlaneService = {
  /** Full health compute + kill switch evaluation in one call. */
  async refreshHealth(userId: string) {
    const health = await systemHealthAggregator.compute(userId);
    killSwitchEngine.evaluate(health);
    return health;
  },

  /** Dispatch a control command — all mutations go through here. */
  async dispatch(command: ControlCommand, callerUserId: string) {
    switch (command.type) {
      case "activate_kill_switch":
        killSwitchEngine.addRule(command.rule);
        break;
      case "deactivate_kill_switch":
        killSwitchEngine.removeRule(command.ruleId);
        break;
      case "update_policy":
        policyEngine.upsertPolicy(command.policy);
        break;
      case "trigger_replay":
        return systemReplayService.replay(command.request, callerUserId);
    }
  },

  getKillSwitchState() {
    return killSwitchState.get();
  },

  getPolicies() {
    return policyEngine.getAll();
  },
};
