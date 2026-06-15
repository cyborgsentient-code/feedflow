/** SHA-256( automationEventId | actionType | userId ) — deterministic, no randomness. */
export async function executionFingerprint(
  automationEventId: string,
  actionType:        string,
  userId:            string,
): Promise<string> {
  const input = [automationEventId, actionType, userId].join("|");
  const buf   = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
