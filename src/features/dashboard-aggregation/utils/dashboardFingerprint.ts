/** SHA-256(userId | window | module | computedAtBucket) — for cache keying. */
export async function dashboardFingerprint(
  userId:    string,
  window:    string,
  module:    string,
  bucketTs:  string,
): Promise<string> {
  const input = [userId, window, module, bucketTs].join("|");
  const buf   = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
