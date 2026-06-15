import { memo } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { colors, spacing, radius } from "@/constants/theme";
import type { AutomationEvent } from "@/features/automation/types/event";

interface ActivitySummaryCardProps {
  events: AutomationEvent[];
}

const ACTION_EMOJI: Record<string, string> = {
  like: "❤️", view: "👁️", search: "🔍", visit: "🔗",
};

function humanLine(event: AutomationEvent): string {
  const t = event.payload.topic ?? event.payload.tag ?? event.payload.keyword ?? event.payload.query;
  const topic = t ? String(t) : null;
  switch (event.type) {
    case "like":   return topic ? `Liked a post about ${topic}` : "Liked a post";
    case "view":   return topic ? `Viewed ${topic} content` : "Viewed a post";
    case "search": return topic ? `Searched for ${topic}` : "Explored Instagram";
    case "visit":  return topic ? `Visited a ${topic} profile` : "Visited a profile";
    default:       return "Took an action";
  }
}

function formatRelative(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

const todayStart = () => new Date().setHours(0, 0, 0, 0);

export const ActivitySummaryCard = memo(function ActivitySummaryCard({ events }: ActivitySummaryCardProps) {
  const todayEvents = events.filter(
    (e) => e.type !== "error" && e.timestamp >= todayStart(),
  );
  const recent = todayEvents.slice(0, 5);
  const lastTs  = events.find((e) => e.type !== "error")?.timestamp ?? null;

  return (
    <Card variant="bordered" padding="lg">
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
        <Text size="base" weight="bold">Today's Activity</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <View style={{ width: 6, height: 6, borderRadius: radius.full, backgroundColor: colors.success }} />
          <Text size="xs" color="3">{todayEvents.length} actions</Text>
        </View>
      </View>

      {recent.length === 0 ? (
        <Text size="sm" color="3">
          FeedFlow is working on your feed. Activity will appear here shortly.
        </Text>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {recent.map((event) => (
            <View key={event.id} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Text style={{ width: 20, textAlign: "center" }}>
                {ACTION_EMOJI[event.type] ?? "⚡"}
              </Text>
              <Text size="sm" style={{ flex: 1 }}>{humanLine(event)}</Text>
              <Text size="xs" color="3">{formatRelative(event.timestamp)}</Text>
            </View>
          ))}
        </View>
      )}

      {lastTs && (
        <Text size="xs" color="3" style={{ marginTop: spacing.md }}>
          Last active {formatRelative(lastTs)}
        </Text>
      )}
    </Card>
  );
});
