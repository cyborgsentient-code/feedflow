/** SHA-256(userId | modelId | date) — daily cost dedup key. */
export async function costFingerprint(userId: string, modelId: string, date: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${userId}|${modelId}|${date}`));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
