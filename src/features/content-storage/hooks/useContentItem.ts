import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { contentReadService } from "../services/contentReadService";
import { FEED_KEY } from "./useContentFeed";

const ITEM_KEY = (id: string) => ["content-item", id] as const;

export function useContentItem(contentId: string) {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  return useQuery({
    queryKey: ITEM_KEY(contentId),
    queryFn: async () => {
      const result = await contentReadService.getContentById(contentId, user!.id);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!contentId && !!user,
    // seed from feed cache if already present to avoid waterfall
    initialData: () => {
      if (!user) return undefined;
      const pages = qc.getQueryData<{ pages: { content_id: string }[][] }>(FEED_KEY(user.id));
      return pages?.pages.flat().find((fi) => fi.content_id === contentId) as undefined;
    },
  });
}
