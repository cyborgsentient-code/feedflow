import { useCallback, memo } from "react";
import { View, FlatList, type ListRenderItem } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAutomationStream } from "@/features/automation/hooks/useAutomationStream";
import { StreamStatusBar } from "@/features/dashboard/components/StreamStatusBar";
import { EventFeedItem } from "@/features/dashboard/components/EventFeedItem";
import { HeroCard } from "@/features/dashboard/components/HeroCard";
import { FeedImpactCard } from "@/features/dashboard/components/FeedImpactCard";
import { ActivitySummaryCard } from "@/features/dashboard/components/ActivitySummaryCard";
import { EmptyFeedState } from "@/features/dashboard/components/EmptyFeedState";
import { HeroSkeleton, FeedSkeleton } from "@/features/dashboard/components/Skeletons";
import { useAuthStore } from "@/stores/authStore";
import { Text } from "@/components/ui/Text";
import { colors, spacing } from "@/constants/theme";
import type { AutomationEvent } from "@/features/automation/types/event";

const VIRTUALIZE_THRESHOLD = 50;

const renderItem: ListRenderItem<AutomationEvent> = ({ item, index }) => (
  <EventFeedItem event={item} isFirst={index === 0} />
);
const keyExtractor = (item: AutomationEvent) => item.id;

const SectionHeader = memo(function SectionHeader() {
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xs }}>
      <Text size="sm" weight="semibold" color="3">YOUR FEED ACTIVITY</Text>
    </View>
  );
});

export default function DashboardScreen() {
  const { user, sessionKey } = useAuthStore();
  const { events, snapshot } = useAutomationStream(user?.id, sessionKey);

  const isConnecting = snapshot.recoveryState === "degraded" && snapshot.eventCount === 0;

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: 62, offset: 62 * index, index }),
    [],
  );

  const ListHeader = useCallback(() => (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.lg }}>
      {isConnecting ? <HeroSkeleton /> : (
        <>
          {/* Feed Impact — top card, product story */}
          <FeedImpactCard />
          {/* Today's automation activity */}
          <ActivitySummaryCard events={events} />
          {/* Automation control toggle */}
          <HeroCard snapshot={snapshot} totalEvents={snapshot.eventCount} />
        </>
      )}
      <SectionHeader />
    </View>
  ), [snapshot, events, isConnecting]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }} edges={["top"]}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text size="xl" weight="bold">Your Feed</Text>
      </View>

      <StreamStatusBar snapshot={snapshot} />

      <FlatList
        data={events}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={isConnecting ? <FeedSkeleton /> : <EmptyFeedState />}
        {...(events.length > VIRTUALIZE_THRESHOLD ? { getItemLayout } : {})}
        removeClippedSubviews={events.length > VIRTUALIZE_THRESHOLD}
        maxToRenderPerBatch={20}
        windowSize={10}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={events.length === 0 && !isConnecting ? { flex: 1 } : { paddingBottom: spacing.lg }}
      />
    </SafeAreaView>
  );
}
