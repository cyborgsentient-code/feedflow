import type { PreferenceProfile, PreferenceProfileSnapshot } from "../types";

/** SHA-256(userId | lastInteractionId | interactionCount) */
export async function computeProfileHash(
  userId:            string,
  lastInteractionId: string,
  interactionCount:  number,
): Promise<string> {
  const input = [userId, lastInteractionId, String(interactionCount)].join("|");
  const buf   = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function bumpVersion(current: number): number {
  return current + 1;
}

/** Returns true if affinity maps differ by more than 5% on any shared key. */
export function hasSignificantAffinityShift(
  prev: Record<string, number>,
  next: Record<string, number>,
): boolean {
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  for (const k of keys) {
    if (Math.abs((prev[k] ?? 0) - (next[k] ?? 0)) > 0.05) return true;
  }
  return false;
}

export function snapshotFromProfile(
  profile: PreferenceProfile,
  hash:    string,
): PreferenceProfileSnapshot {
  return {
    userId:                  profile.userId,
    profileVersion:          profile.profileVersion,
    sourceAffinity:          profile.sourceAffinity,
    contentCategoryAffinity: profile.contentCategoryAffinity,
    lastComputedAt:          profile.lastUpdated,
    hash,
  };
}
