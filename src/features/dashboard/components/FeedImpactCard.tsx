import { memo, useEffect } from "react";
import { View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { colors, spacing, radius } from "@/constants/theme";
import { journeyService } from "@/services/journeyService";
import { useAuthStore } from "@/stores/authStore";
import { INTERESTS } from "@/features/onboarding/constants/interests";

type CategoryImpact = Record<string, { actions: number; share_of_total: number; reinforcement_score_delta: number }>;

function top3(impact: CategoryImpact) {
  return Object.entries(impact)
    .sort((a, b) => b[1].actions - a[1].actions)
    .slice(0, 3);
}

export const FeedImpactCard = memo(function FeedImpactCard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: journey, isLoading } = useQuery({
    queryKey: ["journey", user?.id],
    queryFn:  () => journeyService.getJourney(user!.id),
    enabled:  !!user,
    staleTime: 60_000,
  });

  const isEmpty = !journey ||
    (journey.feed_relevance?.after_score === 0 &&
     !Object.keys(journey.category_impact ?? {}).length);

  // On empty state: bootstrap then re-fetch once
  useEffect(() => {
    if (!isLoading && isEmpty && user) {
      journeyService.bootstrap(user.id).then(() => {
        qc.invalidateQueries({ queryKey: ["journey", user.id] });
        qc.invalidateQueries({ queryKey: ["action_counts", user.id] });
        qc.invalidateQueries({ queryKey: ["reinforcement_score", user.id] });
      });
    }
  }, [isLoading, isEmpty, user?.id]);

  if (isLoading) return null;

  if (isEmpty) {
    return (
      <Card variant="elevated" padding="lg">
        <View style={{ gap: spacing.sm }}>
          <Text size="base" weight="bold">Your Feed Impact</Text>
          <Text size="sm" color="2">
            Initializing personalisation… this takes a moment.
          </Text>
          <View style={{ height: 6, borderRadius: radius.full, backgroundColor: colors.elevated }}>
            <View style={{ width: "8%", height: 6, borderRadius: radius.full, backgroundColor: colors.primary }} />
          </View>
          <Text size="xs" color="3">Demo initializing personalization…</Text>
        </View>
      </Card>
    );
  }

  const { feed_relevance, category_impact, reinforcement } = journey;
  const topCategories = top3(category_impact ?? {});
  const score = reinforcement?.total_score ?? 0;
  const delta = feed_relevance?.delta ?? 0;
  const afterScore = feed_relevance?.after_score ?? 0;
  const scoreColor = afterScore >= 70 ? colors.success : afterScore >= 40 ? colors.primary : colors.warning;

  return (
    <Card variant="elevated" padding="lg">
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
        <Text size="base" weight="bold">Your Feed Impact</Text>
        {delta > 0 && (
          <View style={{
            paddingHorizontal: spacing.sm, paddingVertical: 3,
            borderRadius: radius.full, backgroundColor: `${colors.success}18`,
          }}>
            <Text size="xs" weight="semibold" style={{ color: colors.success }}>+{delta} pts</Text>
          </View>
        )}
      </View>

      {/* Relevance bar */}
      <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text size="xs" color="3">Feed Relevance</Text>
          <Text size="xs" weight="semibold" style={{ color: scoreColor }}>{afterScore}/100</Text>
        </View>
        <View style={{ height: 6, borderRadius: radius.full, backgroundColor: colors.elevated }}>
          <View style={{ width: `${afterScore}%`, height: 6, borderRadius: radius.full, backgroundColor: scoreColor }} />
        </View>
        {delta > 0 && (
          <Text size="xs" color="3">
            {`${feed_relevance.before_score} → ${afterScore} since you started`}
          </Text>
        )}
      </View>

      {/* Top 3 categories */}
      {topCategories.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <Text size="xs" weight="semibold" color="3">YOU'RE SEEING MORE OF</Text>
          {topCategories.map(([slug, data]) => {
            const interest = INTERESTS.find((i) => i.slug === slug);
            const pct = Math.round(data.share_of_total * 100);
            return (
              <View key={slug} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Text style={{ width: 20, textAlign: "center" }}>{interest?.emoji ?? "📌"}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                    <Text size="sm" weight="medium">{interest?.label ?? slug}</Text>
                    <Text size="xs" color="3">{pct}%</Text>
                  </View>
                  <View style={{ height: 4, borderRadius: radius.full, backgroundColor: colors.elevated }}>
                    <View style={{
                      width: `${pct}%`, height: 4,
                      borderRadius: radius.full, backgroundColor: colors.primaryLight,
                    }} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
});
