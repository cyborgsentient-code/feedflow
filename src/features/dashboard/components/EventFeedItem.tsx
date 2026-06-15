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
  like:   { emoji: "❤️",  label: "Like",    color: colors.accent },
  view:   { emoji: "👁️",  label: "View",    color: colors.primary },
  search: { emoji: "🔍",  label: "Search",  color: colors.primaryLight },
  visit:  { emoji: "🔗",  label: "Visit",   color: colors.success },
  error:  { emoji: "⚠️",  label: "Error",   color: colors.error },
} as const;

function topic(payload: Readonly<Record<string, unknown>>): string {
  const t = payload.topic ?? payload.tag ?? payload.keyword ?? payload.query ?? payload.category;
  return t ? String(t) : "";
}

function humanLabel(event: AutomationEvent): string {
  const t = topic(event.payload);
  switch (event.type) {
    case "like":   return t ? `Liked a post about ${t}` : "Liked a post";
    case "view":   return t ? `Viewed a post about ${t}` : "Viewed a post";
    case "search": return t ? `Searched for ${t}` : "Searched Instagram";
    case "visit":  return t ? `Visited a ${t} profile` : "Visited a profile";
    case "error":  return "Action could not complete";
  }
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatRelative(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5)  return "just now";
  if (diff < 60) return `${diff}s ago`;
  return formatTime(ts);
}

export const EventFeedItem = memo(function EventFeedItem({ event, isFirst }: EventFeedItemProps) {
  const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.view;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: isFirst ? `${cfg.color}08` : "transparent",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        borderLeftWidth: isFirst ? 2 : 0,
        borderLeftColor: cfg.color,
      }}
      accessibilityRole="none"
      accessibilityLabel={`${cfg.label} event at ${formatTime(event.timestamp)}`}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: radius.md,
          backgroundColor: `${cfg.color}18`,
          borderWidth: 1,
          borderColor: `${cfg.color}25`,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text size="base">{cfg.emoji}</Text>
      </View>

      <View style={{ flex: 1, gap: 3 }}>
        <Text size="sm" weight="semibold" color="1">{humanLabel(event)}</Text>
      </View>

      <Text size="xs" color="3">{formatRelative(event.timestamp)}</Text>
    </View>
  );
}, (prev, next) => prev.event.id === next.event.id && prev.isFirst === next.isFirst);
