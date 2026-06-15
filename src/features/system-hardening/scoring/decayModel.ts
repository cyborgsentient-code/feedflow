/** Exponential decay with half-life = 15 minutes. Pure function. */
const HALF_LIFE_MS = 15 * 60 * 1000;
const LAMBDA       = Math.LN2 / HALF_LIFE_MS;

export function decaySignal(score: number, ageMs: number): number {
  return score * Math.exp(-LAMBDA * ageMs);
}
