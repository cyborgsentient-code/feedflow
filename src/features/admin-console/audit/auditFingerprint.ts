/** SHA-256(action|adminId|timestamp) — immutable audit entry fingerprint */
export async function auditFingerprint(
  action:    string,
  adminId:   string,
  timestamp: string,
): Promise<string> {
  const input = [action, adminId, timestamp].join("|");
  const buf   = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
