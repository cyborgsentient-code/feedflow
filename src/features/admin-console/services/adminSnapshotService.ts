import { systemInspector } from "../inspection/systemInspector";
import { moduleInspector } from "../inspection/moduleInspector";
import type { SystemSnapshot, ModuleSnapshot } from "../types";
import type { ModuleType } from "@/features/intelligence-control-plane/types";

const MODULES: ModuleType[] = ["feed", "automation", "execution", "ai", "intelligence"];

export const adminSnapshotService = {
  async getSystemSnapshot(adminId: string): Promise<SystemSnapshot> {
    return systemInspector.snapshot(adminId);
  },

  async getModuleSnapshot(module: ModuleType, userId: string): Promise<ModuleSnapshot> {
    return moduleInspector.inspect(module, userId);
  },

  /** All module snapshots in parallel. */
  async getAllModuleSnapshots(userId: string): Promise<ModuleSnapshot[]> {
    return Promise.all(MODULES.map((m) => moduleInspector.inspect(m, userId)));
  },
};
