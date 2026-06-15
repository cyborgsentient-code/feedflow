/** SHA-256(taskType | templateVersion | contentFingerprint) */
export async function promptFingerprint(
  taskType:           string,
  templateVersion:    string,
  contentFingerprint: string,
): Promise<string> {
  const input = [taskType, templateVersion, contentFingerprint].join("|");
  const buf   = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
