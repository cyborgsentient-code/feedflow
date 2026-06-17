import { memo } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/Text";
import { colors, spacing, radius } from "@/constants/theme";
import type { AutomationEvent } from "@/features/automation/types/event";

interface EventFeedItemProps {
  event: AutomationEvent;
  isFirst?: boolean;
}

const TYPE_CONFIG = {
  like:   { emoji: "❤️",  label: "Liked",    color: "#E1306C",       bg: "#E1306C18" },
  view:   { emoji: "👁️",  label: "Viewed",   color: colors.primary,  bg: `${colors.primary}18` },
  search: { emoji: "🔍",  label: "Explored", color: colors.primaryLight, bg: `${colors.primaryLight}18` },
  visit:  { emoji: "🔗",  label: "Visited",  color: colors.success,  bg: `${colors.success}18` },
  error:  { emoji: "⚠️",  label: "Failed",   color: colors.error,    bg: `${colors.error}18` },
} as const;

const TOPIC_GRADIENTS: Record<string, string> = {
  technology: "#4F8EF7", fitness: "#F7934F", food: "#F7C94F",
  travel: "#4FF79E",     music: "#C94FF7",   photography: "#F74F4F",
  gaming: "#4FF7F0",     business: "#F7F74F", art: "#F74FC9",
  science: "#4FC9F7",    fashion: "#F7724F",  design: "#724FF7",
  ai: "#4F8EF7",         startups: "#F7934F", finance: "#4FF79E",
  health: "#6BF74F",     education: "#F7C94F",
};

const CONTENT_CAPTIONS: Record<string, string[]> = {
  like:   ["Great content reinforced for your feed", "Engagement signal sent to algorithm", "Post matched your interests"],
  view:   ["Content scanned and indexed", "Relevance signal detected", "Feed preference recorded"],
  search: ["Hashtag explored for fresh content", "New posts discovered in category", "Interest category mapped"],
  visit:  ["Profile matched your interests", "Account added to feed signals"],
  error:  ["Could not complete action"],
};

function topic(payload: Readonly<Record<string, unknown>>): string {
  const t = payload.topic ?? payload.tag ?? payload.keyword ?? payload.query ?? payload.category;
  return t ? String(t) : "";
}

function hashtag(payload: Readonly<Record<string, unknown>>): string {
  const t = payload.tag ?? payload.keyword;
  return t ? `#${String(t)}` : "";
}

function caption(type: string): string {
  const list = CONTENT_CAPTIONS[type] ?? CONTENT_CAPTIONS.view;
  return list[Math.floor(Math.random() * list.length)];
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatRelative(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5)   return "just now";
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 120) return "1m ago";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return formatTime(ts);
}

export const EventFeedItem = memo(function EventFeedItem({ event, isFirst }: EventFeedItemProps) {
  const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.view;
  const t = topic(event.payload);
  const tag = hashtag(event.payload);
  const topicColor = TOPIC_GRADIENTS[t] ?? colors.primary;

  return (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginVertical: spacing.xs,
        borderRadius: radius.lg,
        backgroundColor: colors.elevated,
        borderWidth: 1,
        borderColor: isFirst ? `${cfg.color}40` : colors.border,
        overflow: "hidden",
      }}
      accessibilityRole="none"
    >
      {/* Top accent bar for first/latest item */}
      {isFirst && (
        <View style={{ height: 2, backgroundColor: cfg.color }} />
      )}

      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        {/* Header row */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            {/* Action icon */}
            <View style={{
              width: 32, height: 32, borderRadius: radius.md,
              backgroundColor: cfg.bg,
              justifyContent: "center", alignItems: "center",
            }}>
              <Text style={{ fontSize: 15 }}>{cfg.emoji}</Text>
            </View>
            {/* Action type badge */}
            <View style={{
              paddingHorizontal: spacing.sm, paddingVertical: 2,
              borderRadius: radius.full,
              backgroundColor: cfg.bg,
            }}>
              <Text size="xs" weight="semibold" style={{ color: cfg.color }}>{cfg.label}</Text>
            </View>
          </View>
          <Text size="xs" color="3">{formatRelative(event.timestamp)}</Text>
        </View>

        {/* Topic pill + hashtag */}
        {t ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <View style={{
              paddingHorizontal: spacing.sm, paddingVertical: 3,
              borderRadius: radius.full,
              backgroundColor: `${topicColor}20`,
              borderWidth: 1,
              borderColor: `${topicColor}40`,
            }}>
              <Text size="xs" weight="semibold" style={{ color: topicColor }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </View>
            {tag ? <Text size="xs" color="3">{tag}</Text> : null}
          </View>
        ) : null}

        {/* Caption */}
        <Text size="sm" color="2">{caption(event.type)}</Text>
      </View>
    </View>
  );
}, (prev, next) => prev.event.id === next.event.id && prev.isFirst === next.isFirst);
