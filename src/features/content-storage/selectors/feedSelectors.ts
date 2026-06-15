import type { FeedItem, FeedBucket, FeedCursor } from "../types";

/** All selectors are pure functions — no side effects, no async. */

export function selectLatestFeed(items: FeedItem[]): FeedItem[] {
  return items.filter((i) => i.feed_bucket === "latest");
}

export function selectSourceFeed(items: FeedItem[], sourceId: string): FeedItem[] {
  return items.filter((i) => i.source_id === sourceId);
}

export function selectRankedFeed(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) =>
    b.rank_score !== a.rank_score
      ? b.rank_score - a.rank_score
      : b.created_at.localeCompare(a.created_at),
  );
}

export function selectByBucket(items: FeedItem[], bucket: FeedBucket): FeedItem[] {
  return items.filter((i) => i.feed_bucket === bucket);
}

/** Extract the cursor from the last item in a page for next-page requests. */
export function selectNextCursor(items: FeedItem[]): FeedCursor | undefined {
  const last = items.at(-1);
  if (!last) return undefined;
  return { rank_score: last.rank_score, created_at: last.created_at };
}
