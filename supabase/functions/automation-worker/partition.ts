/**
 * Deterministic partition assignment.
 * partitionId = djb2(userId + contentId) % N_PARTITIONS
 * Pure function — no randomness, same input always returns same partition.
 */
export const N_PARTITIONS = 16;

export function assignPartition(userId: string, contentId: string): number {
  const input = `${userId}|${contentId}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash % N_PARTITIONS;
}
