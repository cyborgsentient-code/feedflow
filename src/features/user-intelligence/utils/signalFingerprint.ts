/** SHA-256(userId | contentId | profileVersion) */
export async function signalFingerprint(
  userId:         string,
  contentId:      string,
  profileVersion: number,
): Promise<string> {
  const input = [userId, contentId, String(profileVersion)].join("|");
  const buf   = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
