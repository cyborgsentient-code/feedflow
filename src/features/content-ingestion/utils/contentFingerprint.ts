/**
 * Stable fingerprint: SHA-256 of "sourceId|externalId|title|publishedAt".
 * Falls back to "id" when externalId is absent.
 * Uses the Web Crypto API (available in React Native via the Hermes runtime).
 */
export async function contentFingerprint(
  sourceId:    string,
  externalId:  string | undefined,
  title:       string,
  publishedAt: string,
): Promise<string> {
  const input = [sourceId, externalId ?? "", title.trim(), publishedAt].join("|");
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
