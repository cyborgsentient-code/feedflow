import type { KillSwitchState, KillSwitchAction, ModuleType } from "../types";

const state: KillSwitchState = {
  feed:         null,
  automation:   null,
  execution:    null,
  ai:           null,
  intelligence: null,
};

export const killSwitchState = {
  get(): KillSwitchState {
    return { ...state };
  },

  activate(module: ModuleType, action: KillSwitchAction): void {
    state[module] = action;
  },

  deactivate(module: ModuleType): void {
    state[module] = null;
  },

  isActive(module: ModuleType): boolean {
    return state[module] !== null;
  },

  getAction(module: ModuleType): KillSwitchAction | null {
    return state[module];
  },
};
