import type { InteractionType } from "../types";
import { applyAffinityDecay } from "../utils/affinityDecay";

/** Interaction weights — single source of truth. */
const WEIGHTS: Record<InteractionType, number> = {
  view:              1,
  click:             2,
  save:              4,
  summary_open:      3,
  draft_open:        3,
  notification_open: 2,
};

type RawInteraction = { interaction: InteractionType; created_at: string };

/**
 * Calculate normalized [0,1] affinity score for a source from raw interactions.
 * Applies exponential time decay per interaction before summing.
 * Pure function — no I/O.
 */
export function calculateSourceAffinity(
  interactions: RawInteraction[],
  now = Date.now(),
): number {
  if (!interactions.length) return 0;

  let weightedSum = 0;
  let maxPossible = 0;

  for (const row of interactions) {
    const ageMs   = now - new Date(row.created_at).getTime();
    const weight  = WEIGHTS[row.interaction] ?? 1;
    weightedSum  += applyAffinityDecay(weight, ageMs);
    maxPossible  += weight; // undecayed ceiling for normalization
  }

  return maxPossible > 0 ? Math.min(1, weightedSum / maxPossible) : 0;
}
