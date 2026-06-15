import { useInfiniteQuery } from "@tanstack/react-query";
import { feedQueryService } from "../services/feedQueryService";
import { selectNextCursor } from "../selectors/feedSelectors";
import type { FeedCursor } from "../types";

export const FEED_KEY = (userId: string) => ["feed", userId] as const;

export function useContentFeed(userId: string) {
  const query = useInfiniteQuery({
    queryKey: FEED_KEY(userId),
    queryFn: async ({ pageParam }) => {
      const result = await feedQueryService.getUserFeed(userId, pageParam as FeedCursor | undefined);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    initialPageParam: undefined as FeedCursor | undefined,
    getNextPageParam: (lastPage) => selectNextCursor(lastPage),
    enabled: !!userId,
  });

  return {
    feedItems: query.data?.pages.flat() ?? [],
    loading:   query.isLoading,
    error:     query.error,
    refresh:   () => query.refetch(),
    loadMore:  () => { if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage(); },
  };
}
