import type { AutomationRule } from "../types";
import { evaluateRules } from "../utils/ruleMatcher";
import { eventFingerprint } from "../utils/eventFingerprint";
import { buildIndex, getCandidateRuleIds } from "./ruleIndexService";
import { enqueueToRemoteQueue } from "./executionQueue";
import { mapEngineError } from "./engineErrors";
import type { ContentItem, FeedItem, TriggerContext } from "../types";

let sequenceCounter = 0;

export const triggerEngine = {
  /**
   * Evaluate rules for a content event and write matching jobs to automation_queue.
   * No local execution — all processing happens server-side.
   * Fire-and-forget safe: all errors absorbed internally.
   */
  async processContentEvent(
    userId:   string,
    content:  ContentItem,
    feedItem: FeedItem,
    rules:    AutomationRule[],
    now = Date.now(),
  ): Promise<void> {
    try {
      const idx      = buildIndex(rules);
      const haystack = `${content.title} ${content.content}`.toLowerCase();
      const candidates = getCandidateRuleIds(idx, content.source_id, feedItem.feed_bucket, haystack);
      const subset   = rules.filter((r) => candidates.has(r.id));

      const ctx: TriggerContext = { userId, content, feedItem, rules: subset, now };
      const matches = evaluateRules(ctx);

      for (const { rule, matchedKeywords } of matches) {
        const fp = await eventFingerprint(userId, content.id, rule.id, now);
        await enqueueToRemoteQueue({
          userId,
          contentId:       content.id,
          ruleId:          rule.id,
          fingerprint:     fp,
          rankScore:       feedItem.rank_score,
          matchedKeywords,
          sourceId:        content.source_id,
          sequenceNumber:  ++sequenceCounter,
          createdAt:       new Date(now).toISOString(),
        });
      }
    } catch (e) {
      mapEngineError(e); // absorb — never propagate to subscription caller
    }
  },
};
