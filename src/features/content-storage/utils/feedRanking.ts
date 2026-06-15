/**
 * Deterministic feed ranking — no randomness, no external state.
 *
 * rankScore = (recencyWeight * 0.5) + (sourceAffinity * 0.3) + (decayFactor * 0.2)
 *
 * All inputs are normalised to [0, 1].
 */

const HALF_LIFE_HOURS = 24; // score halves every 24 h

/** recencyWeight: 1.0 at publish time, decays exponentially toward 0. */
export function recencyWeight(publishedAt: string, now = Date.now()): number {
  const ageHours = (now - new Date(publishedAt).getTime()) / 3_600_000;
  return Math.exp((-Math.LN2 / HALF_LIFE_HOURS) * ageHours);
}

/**
 * decayFactor: same exponential model, used as the explicit decay component.
 * Kept as a separate named export so callers can store it on FeedItem.
 */
export function decayFactor(publishedAt: string, now = Date.now()): number {
  return recencyWeight(publishedAt, now);
}

/**
 * sourceAffinity: affinity ∈ [0, 1] supplied by the materializer
 * (e.g. ratio of user interactions with this source).
 * Defaults to 0.5 (neutral) when unknown.
 */
export function computeRankScore(
  publishedAt:    string,
  sourceAffinity: number = 0.5,
  now:            number = Date.now(),
): { rankScore: number; decayScore: number; relevanceScore: number } {
  const recency  = recencyWeight(publishedAt, now);
  const decay    = decayFactor(publishedAt, now);
  const rankScore =
    recency        * 0.5 +
    sourceAffinity * 0.3 +
    decay          * 0.2;
  return {
    rankScore:      Math.min(1, Math.max(0, rankScore)),
    decayScore:     decay,
    relevanceScore: sourceAffinity,
  };
}
