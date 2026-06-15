/** SHA-256 of "userId|contentId|ruleId|bucketedMinute" — deterministic per 60-second window. */
export async function eventFingerprint(
  userId:    string,
  contentId: string,
  ruleId:    string,
  now:       number,   // ms
): Promise<string> {
  const bucket = Math.floor(now / 60_000);
  const input  = [userId, contentId, ruleId, String(bucket)].join("|");
  const buf    = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
