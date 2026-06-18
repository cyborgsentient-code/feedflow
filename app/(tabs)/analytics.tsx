import { useEffect, useRef } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { colors, spacing, radius } from "@/constants/theme";
import { INTERESTS } from "@/features/onboarding/constants/interests";
import { AnalyticsSkeleton } from "@/features/dashboard/components/Skeletons";

// ── DB queries (unchanged) ────────────────────────────────────────────────────

async function fetchActionCounts(userId: string) {
  const { data } = await supabase
    .from("automation_logs")
    .select("action_type")
    .eq("user_id", userId);
  const counts = { total: 0, like: 0, view: 0, search: 0, visit: 0 };
  for (const row of data ?? []) {
    counts.total++;
    const t = row.action_type as string;
    if (t === "like" || t === "post_liked")        counts.like++;
    else if (t === "view" || t === "reel_watched") counts.view++;
    else if (t === "search" || t === "keyword_searched") counts.search++;
    else if (t === "visit" || t === "profile_visited")   counts.visit++;
  }
  return counts;
}

async function fetchDailyTrend(userId: string): Promise<number[]> {
  const since = new Date(Date.now() - 6 * 86400_000).toISOString();
  const { data } = await supabase
    .from("automation_logs")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  const buckets = new Array(7).fill(0);
  const now = Date.now();
  for (const row of data ?? []) {
    const age = now - new Date(row.created_at).getTime();
    buckets[6 - Math.min(6, Math.floor(age / 86400_000))]++;
  }
  return buckets;
}

async function fetchTopCategories(userId: string): Promise<{ slug: string; count: number }[]> {
  const { data } = await supabase
    .from("automation_logs")
    .select("category_slug")
    .eq("user_id", userId)
    .not("category_slug", "is", null);

  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.category_slug) map[row.category_slug] = (map[row.category_slug] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

async function fetchReinforcementScore(userId: string): Promise<number> {
  const { count } = await supabase
    .from("automation_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  const total = count ?? 0;
  return Math.min(100, Math.round(Math.sqrt(total) * 4.5));
}

async function fetchLastActivity(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("automation_logs")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.created_at ?? null;
}

function formatLastActivity(iso: string | null): string {
  if (!iso) return "No activity yet";
  const diffS = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffS < 60) return `${diffS}s ago`;
  const diffM = Math.floor(diffS / 60);
  if (diffM < 60) return `${diffM}m ago`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

// ── Realtime invalidation hook ────────────────────────────────────────────────
// Single channel subscription — invalidates all analytics keys on any
// automation_logs INSERT for this user. No polling needed.
function useAnalyticsRealtime(userId: string | undefined) {
  const qc = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`analytics_realtime:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "automation_logs", filter: `user_id=eq.${userId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["action_counts", userId] });
          qc.invalidateQueries({ queryKey: ["daily_trend", userId] });
          qc.invalidateQueries({ queryKey: ["top_categories", userId] });
          qc.invalidateQueries({ queryKey: ["reinforcement_score", userId] });
          qc.invalidateQueries({ queryKey: ["last_activity", userId] });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "automation_execution_trace", filter: `user_id=eq.${userId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["reinforcement_score", userId] });
        },
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [userId, qc]);
}

// ── Component ─────────────────────────────────────────────────────────────────
const BAR_MAX_HEIGHT = 48;
const DAY_LABELS = ["7d", "6d", "5d", "4d", "3d", "2d", "1d"];

export default function AnalyticsScreen() {
  const { user } = useAuthStore();

  // Subscribe to realtime — no refetchInterval on any query
  useAnalyticsRealtime(user?.id);

  const { data: counts, isLoading: countsLoading } = useQuery({
    queryKey: ["action_counts", user?.id],
    queryFn:  () => fetchActionCounts(user!.id),
    enabled:  !!user,
  });

  const { data: trend = [], isLoading: trendLoading } = useQuery({
    queryKey: ["daily_trend", user?.id],
    queryFn:  () => fetchDailyTrend(user!.id),
    enabled:  !!user,
  });

  const { data: topCats = [], isLoading: catsLoading } = useQuery({
    queryKey: ["top_categories", user?.id],
    queryFn:  () => fetchTopCategories(user!.id),
    enabled:  !!user,
  });

  const { data: score = 0 } = useQuery({
    queryKey: ["reinforcement_score", user?.id],
    queryFn:  () => fetchReinforcementScore(user!.id),
    enabled:  !!user,
  });

  const { data: lastActivity = null } = useQuery({
    queryKey: ["last_activity", user?.id],
    queryFn:  () => fetchLastActivity(user!.id),
    enabled:  !!user,
  });

  const isLoading    = countsLoading || trendLoading || catsLoading;
  const trendMax     = Math.max(1, ...trend);
  const totalActions = counts?.total ?? 0;
  const scoreColor   = score >= 70 ? colors.success : score >= 40 ? colors.primary : colors.warning;

  const topInterests = topCats.map(({ slug, count }) => ({
    interest: INTERESTS.find((i) => i.slug === slug),
    count, slug,
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Feed Progress Header */}
        <View style={{ gap: spacing.xs }}>
          <Text size="xl" weight="bold">Feed Progress</Text>
          <Text size="base" color="2">Your Instagram feed is becoming more personalised</Text>
          {score > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs }}>
              <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full, backgroundColor: `${colors.success}18` }}>
                <Text size="sm" weight="semibold" style={{ color: colors.success }}>+{score}% relevance improvement</Text>
              </View>
              {topInterests[0]?.interest && (
                <Text size="sm" color="3">{topInterests[0].interest.emoji} More {topInterests[0].interest.label}</Text>
              )}
            </View>
          )}
        </View>

        {isLoading ? <AnalyticsSkeleton /> : (
          <>
            {/* Feed Relevance Score */}
            <Card variant="elevated" padding="lg">
              <View style={{ alignItems: "center", gap: spacing.md }}>
                <Text size="xs" weight="semibold" color="3">FEED RELEVANCE SCORE</Text>
                <Text size="2xl" weight="bold" style={{ color: scoreColor }}>{score}</Text>
                <Text size="sm" color="2">out of 100</Text>
                <View style={{ width: "100%", height: 8, borderRadius: radius.full, backgroundColor: colors.elevated }}>
                  <View style={{ width: `${score}%`, height: 8, borderRadius: radius.full, backgroundColor: scoreColor }} />
                </View>
                <Text size="xs" color="3">
                  {score === 0 ? "Connect Instagram and start automation to begin" :
                   score < 40  ? "Getting started — keep automation running" :
                   score < 70  ? "Good progress — feed is improving" :
                                 "Excellent — your feed is highly personalised"}
                </Text>
                <View style={{ height: 1, backgroundColor: colors.border, width: "100%" }} />
                <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
                  <Text size="xs" color="3">Last activity</Text>
                  <Text size="xs" weight="medium">{formatLastActivity(lastActivity)}</Text>
                </View>
              </View>
            </Card>

            {/* 7-day activity trend */}
            <Card variant="bordered" padding="lg">
              <View style={{ gap: spacing.md }}>
                <Text size="sm" weight="semibold" color="2">7-Day Activity</Text>
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, height: BAR_MAX_HEIGHT + 20 }}>
                  {trend.map((val, i) => {
                    const height  = Math.max(4, Math.round((val / trendMax) * BAR_MAX_HEIGHT));
                    const isToday = i === trend.length - 1;
                    return (
                      <View key={i} style={{ flex: 1, alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                        <View style={{
                          width: "100%", height, borderRadius: radius.sm,
                          backgroundColor: isToday ? colors.primary : `${colors.primary}50`,
                        }} />
                        <Text size="xs" color="3">{DAY_LABELS[i]}</Text>
                      </View>
                    );
                  })}
                </View>
                <Text size="xs" color="3" style={{ textAlign: "center" }}>
                  {totalActions > 0 ? `${totalActions} total actions recorded` : "Automation hasn't run yet"}
                </Text>
              </View>
            </Card>

            {/* Top interests */}
            <Card variant="bordered" padding="lg">
              <View style={{ gap: spacing.md }}>
                <Text size="sm" weight="semibold" color="2">Top Interests Reinforced</Text>
                {topInterests.length === 0 ? (
                  <Text size="sm" color="3">No activity yet — automation will populate this.</Text>
                ) : topInterests.map(({ interest, count, slug }) => {
                  const pct = totalActions > 0 ? Math.round((count / totalActions) * 100) : 0;
                  return (
                    <View key={slug} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                      <Text size="base">{interest?.emoji ?? "📌"}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                          <Text size="sm" weight="medium">{interest?.label ?? slug}</Text>
                          <Text size="xs" color="3">{pct}%</Text>
                        </View>
                        <View style={{ height: 4, borderRadius: radius.full, backgroundColor: colors.elevated }}>
                          <View style={{ width: `${pct}%`, height: 4, borderRadius: radius.full, backgroundColor: colors.primaryLight }} />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>

            {/* Action breakdown */}
            <Card variant="bordered" padding="lg">
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ gap: spacing.xs }}>
                  <Text size="xs" color="3">TOTAL AUTOMATION ACTIONS</Text>
                  <Text size="2xl" weight="bold">{totalActions}</Text>
                </View>
                <Text size="2xl">⚡</Text>
              </View>
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />
              <View style={{ gap: spacing.sm }}>
                {[
                  { label: "Likes",    value: counts?.like   ?? 0, emoji: "❤️" },
                  { label: "Views",    value: counts?.view   ?? 0, emoji: "👁️" },
                  { label: "Searches", value: counts?.search ?? 0, emoji: "🔍" },
                  { label: "Visits",   value: counts?.visit  ?? 0, emoji: "🔗" },
                ].map(({ label, value, emoji }) => (
                  <View key={label} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text size="sm" color="3">{emoji} {label}</Text>
                    <Text size="sm" weight="medium">{value}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
