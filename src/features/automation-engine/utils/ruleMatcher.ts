import type { AutomationRule, TriggerContext, RuleMatch } from "../types";

const HOURS_MS = 3_600_000;

/** Pure — no side effects, no async, no network. */
export function matchRule(rule: AutomationRule, ctx: TriggerContext): RuleMatch | null {
  if (!rule.enabled) return null;

  const { conditions } = rule;
  const { content, feedItem, now } = ctx;

  // time window
  if (conditions.maxAgeHours !== undefined) {
    const ageHours = (now - new Date(content.published_at).getTime()) / HOURS_MS;
    if (ageHours > conditions.maxAgeHours) return null;
  }

  // source filter
  if (conditions.sourceIds?.length && !conditions.sourceIds.includes(content.source_id)) return null;

  // rank threshold
  if (conditions.minRankScore !== undefined && feedItem.rank_score < conditions.minRankScore) return null;

  // bucket filter
  if (conditions.feedBucket && feedItem.feed_bucket !== conditions.feedBucket) return null;

  // keyword match — case-insensitive substring only (no regex, prevents ReDoS)
  const matchedKeywords: string[] = [];
  if (conditions.keywords?.length) {
    const haystack = `${content.title} ${content.content}`.toLowerCase();
    for (const kw of conditions.keywords) {
      if (haystack.includes(kw.toLowerCase())) matchedKeywords.push(kw);
    }
    if (matchedKeywords.length === 0) return null;
  }

  return { rule, matchedKeywords };
}

/** Evaluate all rules against context — pure, returns only matches. */
export function evaluateRules(ctx: TriggerContext): RuleMatch[] {
  return ctx.rules.flatMap((rule) => {
    const match = matchRule(rule, ctx);
    return match ? [match] : [];
  });
}
