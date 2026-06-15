import type { ModuleType } from "../types";

export type ModuleDescriptor = {
  id:          ModuleType;
  displayName: string;
  healthPath:  string;   // import path for health service (reference only)
  replayable:  boolean;
};

const MODULES: ModuleDescriptor[] = [
  { id: "feed",          displayName: "Content Feed & Ranking",       healthPath: "@/features/content-storage",         replayable: false },
  { id: "automation",    displayName: "Automation Engine",            healthPath: "@/features/automation-observability", replayable: true  },
  { id: "execution",     displayName: "Action Execution",             healthPath: "@/features/execution-reliability",   replayable: true  },
  { id: "ai",            displayName: "AI Processing Pipeline",       healthPath: "@/features/ai-reliability",          replayable: true  },
  { id: "intelligence",  displayName: "User Intelligence & Profiles", healthPath: "@/features/user-intelligence",       replayable: true  },
];

export const moduleRegistry = {
  getAll(): ModuleDescriptor[] {
    return MODULES;
  },

  get(id: ModuleType): ModuleDescriptor | undefined {
    return MODULES.find((m) => m.id === id);
  },

  isReplayable(id: ModuleType): boolean {
    return MODULES.find((m) => m.id === id)?.replayable ?? false;
  },
};
