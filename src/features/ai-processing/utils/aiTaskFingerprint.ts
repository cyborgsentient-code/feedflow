/** SHA-256(userId | contentId | taskType) — stable job identity key. */
export async function aiTaskFingerprint(
  userId:    string,
  contentId: string,
  taskType:  string,
): Promise<string> {
  const input = [userId, contentId, taskType].join("|");
  const buf   = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
