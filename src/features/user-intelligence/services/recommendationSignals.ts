import type { PreferenceProfile, RecommendationSignal } from "../types";
import { signalFingerprint } from "../utils/signalFingerprint";
import { signalCache } from "../materialization/signalCache";

type ContentMeta = { contentId: string; sourceId: string; feedRankScore: number; engagementScore?: number };

/**
 * signalScore = (sourceAffinity × 0.5) + (feedRank × 0.3) + (engagementWeight × 0.2)
 * All inputs normalized [0,1]. Pure async (only SHA-256).
 */
export async function generateSignal(
  profile: PreferenceProfile,
  content: ContentMeta,
): Promise<RecommendationSignal> {
  const sourceAffinity   = profile.sourceAffinity[content.sourceId] ?? 0;
  const engagementWeight = Math.min(1, content.engagementScore ?? 0);
  const recencyWeight    = Math.min(1, content.feedRankScore);

  const score =
    sourceAffinity   * 0.5 +
    recencyWeight    * 0.3 +
    engagementWeight * 0.2;

  const fp = await signalFingerprint(profile.userId, content.contentId, profile.profileVersion);

  return {
    userId:      profile.userId,
    contentId:   content.contentId,
    fingerprint: fp,
    score:       Math.min(1, Math.max(0, score)),
    components:  { sourceAffinity, engagementWeight, recencyWeight },
    createdAt:   new Date().toISOString(),
  };
}

export async function generateSignals(
  profile:  PreferenceProfile,
  contents: ContentMeta[],
): Promise<RecommendationSignal[]> {
  const cached = signalCache.get(profile.userId, profile.profileVersion);
  if (cached) return cached;

  const signals = await Promise.all(contents.map((c) => generateSignal(profile, c)));
  signalCache.set(profile.userId, profile.profileVersion, signals);
  return signals;
}
