import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { triggerEngine } from "../services/triggerEngine";
import type { AutomationRule, ContentItem, FeedItem } from "../types";
import type { QueueJobStatus } from "../types/distributed";

interface UseAutomationEngineOptions {
  userId:      string;
  rules:       AutomationRule[];
  getFeedItem: (contentId: string) => FeedItem | undefined;
}

export type QueueStats = {
  pendingCount:    number;
  processingCount: number;
  failedCount:     number;
};

export function useDistributedAutomationEngine({
  userId,
  rules,
  getFeedItem,
}: UseAutomationEngineOptions): QueueStats {
  const rulesRef   = useRef(rules);
  const getFeedRef = useRef(getFeedItem);
  useEffect(() => { rulesRef.current   = rules;       }, [rules]);
  useEffect(() => { getFeedRef.current = getFeedItem; }, [getFeedItem]);

  const [stats, setStats] = useState<QueueStats>({ pendingCount: 0, processingCount: 0, failedCount: 0 });

  useEffect(() => {
    if (!userId) return;

    // 1. Produce: listen for new content → write to automation_queue
    const producerChannel = supabase
      .channel(`engine-producer:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "content_items", filter: `user_id=eq.${userId}` },
        (payload) => {
          const content  = payload.new as ContentItem;
          const feedItem = getFeedRef.current(content.id);
          if (!feedItem) return;
          void triggerEngine.processContentEvent(userId, content, feedItem, rulesRef.current);
        },
      )
      .subscribe();

    // 2. Observe: track queue status changes for this user (read-only)
    const observerChannel = supabase
      .channel(`engine-observer:${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "automation_queue", filter: `user_id=eq.${userId}` },
        (payload) => {
          const status = (payload.new as { status: QueueJobStatus }).status;
          setStats((prev) => {
            if (status === "processing") return { ...prev, processingCount: prev.processingCount + 1 };
            if (status === "done")       return { ...prev, processingCount: Math.max(0, prev.processingCount - 1) };
            if (status === "failed")     return { ...prev, failedCount: prev.failedCount + 1 };
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(producerChannel);
      void supabase.removeChannel(observerChannel);
    };
  }, [userId]);

  return stats;
}
