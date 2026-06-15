import type { AutomationRule, FeedBucket } from "../types";

/**
 * Pre-filter index: O(1) candidate lookup before full rule evaluation.
 * Indexes are rebuilt when rules change via buildIndex().
 */
export type RuleIndex = {
  keywordIndex: Map<string, Set<string>>;   // keyword → ruleIds
  sourceIndex:  Map<string, Set<string>>;   // sourceId → ruleIds
  bucketIndex:  Map<FeedBucket, Set<string>>; // bucket → ruleIds
  allRuleIds:   Set<string>;                 // fallback set
  ruleMap:      Map<string, AutomationRule>; // id → rule
};

export function buildIndex(rules: AutomationRule[]): RuleIndex {
  const idx: RuleIndex = {
    keywordIndex: new Map(),
    sourceIndex:  new Map(),
    bucketIndex:  new Map(),
    allRuleIds:   new Set(),
    ruleMap:      new Map(),
  };

  for (const rule of rules) {
    if (!rule.enabled) continue;
    idx.allRuleIds.add(rule.id);
    idx.ruleMap.set(rule.id, rule);

    for (const kw of rule.conditions.keywords ?? []) {
      const key = kw.toLowerCase();
      if (!idx.keywordIndex.has(key)) idx.keywordIndex.set(key, new Set());
      idx.keywordIndex.get(key)!.add(rule.id);
    }
    for (const sid of rule.conditions.sourceIds ?? []) {
      if (!idx.sourceIndex.has(sid)) idx.sourceIndex.set(sid, new Set());
      idx.sourceIndex.get(sid)!.add(rule.id);
    }
    if (rule.conditions.feedBucket) {
      const b = rule.conditions.feedBucket;
      if (!idx.bucketIndex.has(b)) idx.bucketIndex.set(b, new Set());
      idx.bucketIndex.get(b)!.add(rule.id);
    }
  }
  return idx;
}

/**
 * Return candidate rule ids that MIGHT match — superset, not exact.
 * Callers still run full ruleMatcher on this reduced set.
 */
export function getCandidateRuleIds(
  idx:      RuleIndex,
  sourceId: string,
  bucket:   FeedBucket,
  haystack: string,   // lowercased title+content
): Set<string> {
  // Rules with no conditions on any indexed field must always be evaluated
  const candidates = new Set<string>();

  // source match
  const bySource = idx.sourceIndex.get(sourceId);
  bySource?.forEach((id) => candidates.add(id));

  // bucket match
  const byBucket = idx.bucketIndex.get(bucket);
  byBucket?.forEach((id) => candidates.add(id));

  // keyword match (any keyword present in haystack)
  for (const [kw, ids] of idx.keywordIndex) {
    if (haystack.includes(kw)) ids.forEach((id) => candidates.add(id));
  }

  // Rules that have no indexed conditions (e.g. only minRankScore / maxAgeHours)
  // must fall through to full scan; include them via allRuleIds minus those
  // already filtered by at least one index condition.
  const indexedRuleIds = new Set([
    ...Array.from(idx.sourceIndex.values()).flatMap((s) => [...s]),
    ...Array.from(idx.bucketIndex.values()).flatMap((s) => [...s]),
    ...Array.from(idx.keywordIndex.values()).flatMap((s) => [...s]),
  ]);
  for (const id of idx.allRuleIds) {
    if (!indexedRuleIds.has(id)) candidates.add(id); // unindexed rule — always evaluate
  }

  return candidates;
}
