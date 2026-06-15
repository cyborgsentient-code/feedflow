import type { FeedBucket } from "@/features/content-storage/types";
import type { ContentItem, FeedItem } from "@/features/content-storage/types";

export type { ContentItem, FeedItem };

export type AutomationRule = {
  id:      string;
  user_id: string;
  name:    string;
  enabled: boolean;
  conditions: {
    keywords?:     string[];
    sourceIds?:    string[];
    minRankScore?: number;
    feedBucket?:   FeedBucket;
    maxAgeHours?:  number;
  };
};

export type RuleMatch = {
  rule:             AutomationRule;
  matchedKeywords:  string[];
};

export type TriggerContext = {
  userId:    string;
  content:   ContentItem;
  feedItem:  FeedItem;
  rules:     AutomationRule[];
  now:       number;
};

export type EventStatus = "queued" | "processed" | "failed";

export type AutomationEvent = {
  id:             string;
  userId:         string;
  contentId:      string;
  ruleId:         string;
  fingerprint:    string;
  sequenceNumber: number;      // stable ordering key
  createdAt:      string;
  status:         EventStatus;
  metadata: {
    rankScore:       number;
    matchedKeywords: string[];
    sourceId:        string;
  };
};

export type DLQEntry = {
  fingerprint:   string;
  userId:        string;
  contentId:     string;
  ruleId:        string;
  errorType:     string;
  payload:       AutomationEvent;
  retryCount:    number;
  lastAttemptAt: string;
  createdAt:     string;
};

export type BackpressureState = "normal" | "throttled" | "blocked";

export type AutomationEngineError =
  | { code: "rule_evaluation_failed"; message: string }
  | { code: "emit_failed";            message: string }
  | { code: "queue_full";             message: string }
  | { code: "unknown";                message: string };

export type EngineMetrics = {
  queuedEvents:           number;
  processedEvents:        number;
  failedEvents:           number;
  dlqSize:                number;
  backpressureState:      BackpressureState;
  ruleEvalLatencyMs:      number;
  queueDepth:             number;
  droppedDuplicatesCount: number;
};
