import type { NormalizedContent, RawContent } from "../types";
import { contentFingerprint } from "../utils/contentFingerprint";

const TITLE_LIMIT   = 500;
const CONTENT_LIMIT = 10_000;

/** Strip HTML tags and collapse whitespace. */
function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalize ISO timestamp — returns UTC ISO string or throws. */
function normalizeTimestamp(ts: string): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) throw new Error(`normalize: invalid timestamp "${ts}"`);
  return d.toISOString();
}

export async function normalizeContent(raw: RawContent): Promise<NormalizedContent> {
  const title   = sanitizeText(raw.title).slice(0, TITLE_LIMIT);
  const content = sanitizeText(raw.body).slice(0, CONTENT_LIMIT);
  const publishedAt = normalizeTimestamp(raw.published_at);

  const fingerprint = await contentFingerprint(
    raw.source_id,
    raw.external_id,
    title,
    publishedAt,
  );

  // content_hash covers the body so downstream can detect body-only edits
  const bodyHash = await contentFingerprint(raw.source_id, raw.external_id, raw.body, publishedAt);

  return {
    id:           raw.id,
    source_id:    raw.source_id,
    fingerprint,
    title,
    content,
    media:        raw.media_urls.filter((u) => u.startsWith("https://")),
    author:       raw.author ? sanitizeText(raw.author).slice(0, 200) : null,
    published_at: publishedAt,
    content_hash: bodyHash,
    created_at:   new Date().toISOString(),
  };
}
