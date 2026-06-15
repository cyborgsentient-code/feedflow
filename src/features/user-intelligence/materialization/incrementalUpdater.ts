import type { InteractionType, PreferenceProfileSnapshot } from "../types";
import { calculateSourceAffinity } from "../services/affinityCalculator";
import { profileCache } from "./profileCache";
import { bumpVersion, hasSignificantAffinityShift } from "./profileVersioning";

type PatchInteraction = {
  sourceId:    string;
  interaction: InteractionType;
  createdAt:   string;
};

/**
 * Update only the affected sourceId bucket in an existing snapshot.
 * Full recompute is triggered only on version mismatch or cache miss.
 * Returns the updated snapshot (not persisted — caller decides).
 */
export async function applyIncrementalUpdate(
  userId:          string,
  newInteractions: PatchInteraction[],
): Promise<PreferenceProfileSnapshot | null> {
  const snapshot = await profileCache.get(userId);
  if (!snapshot) return null; // cache miss → caller must do full build

  const bySource: Record<string, { interaction: InteractionType; created_at: string }[]> = {};
  for (const ix of newInteractions) {
    if (!bySource[ix.sourceId]) bySource[ix.sourceId] = [];
    bySource[ix.sourceId]!.push({ interaction: ix.interaction, created_at: ix.createdAt });
  }

  const nextAffinity = { ...snapshot.sourceAffinity };
  for (const [sid, ixs] of Object.entries(bySource)) {
    nextAffinity[sid] = calculateSourceAffinity(ixs);
  }

  const shouldBump = hasSignificantAffinityShift(snapshot.sourceAffinity, nextAffinity);

  return {
    ...snapshot,
    sourceAffinity: nextAffinity,
    profileVersion: shouldBump ? bumpVersion(snapshot.profileVersion) : snapshot.profileVersion,
    lastComputedAt: new Date().toISOString(),
  };
}
