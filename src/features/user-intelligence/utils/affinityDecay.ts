/** score × e^(−λt), half-life = 30 days. Pure function. */
const HALF_LIFE_DAYS = 30;
const LAMBDA = Math.LN2 / HALF_LIFE_DAYS;

export function applyAffinityDecay(score: number, ageMs: number): number {
  const ageDays = ageMs / 86_400_000;
  return score * Math.exp(-LAMBDA * ageDays);
}
