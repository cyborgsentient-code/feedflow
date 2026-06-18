import { memo, useState, useEffect, useCallback } from "react";
import { View, Pressable, ActivityIndicator } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { colors, spacing, radius } from "@/constants/theme";
import { userSettingsService } from "@/services/userSettingsService";
import { useAuthStore } from "@/stores/authStore";
import type { StreamSnapshot } from "@/features/automation/types/event";

interface HeroCardProps {
  snapshot: StreamSnapshot;
  totalEvents: number;
}

function formatRelativeTime(ts: number | null): string {
  if (!ts) return "Not yet active";
  const diffS = Math.floor((Date.now() - ts) / 1000);
  if (diffS < 60) return `${diffS}s ago`;
  const diffM = Math.floor(diffS / 60);
  if (diffM < 60) return `${diffM}m ago`;
  return `${Math.floor(diffM / 60)}h ago`;
}

export const HeroCard = memo(function HeroCard({ snapshot, totalEvents }: HeroCardProps) {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["user_settings", user?.id],
    queryFn: async () => {
      const result = await userSettingsService.getOrCreate(user!.id);
      console.log(`[HeroCard] settings loaded — automation_enabled: ${result.automation_enabled}`);
      return result;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const automationOn = settings?.automation_enabled ?? true;

  const { mutate: toggle, isPending } = useMutation({
    mutationFn: (enabled: boolean) => {
      console.log(`[HeroCard] toggle automation → ${enabled}`);
      return userSettingsService.setAutomationEnabled(user!.id, enabled);
    },
    onMutate: async (enabled) => {
      await qc.cancelQueries({ queryKey: ["user_settings", user?.id] });
      qc.setQueryData(["user_settings", user?.id], (old: typeof settings) =>
        old ? { ...old, automation_enabled: enabled } : old,
      );
    },
    onSuccess: (_, enabled) => {
      console.log(`[HeroCard] toggle success — automation_enabled: ${enabled}`);
    },
    onError: (err, enabled) => {
      console.error(`[HeroCard] toggle failed — tried to set ${enabled}:`, err);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["user_settings", user?.id] }),
  });

  const statusColor = automationOn ? colors.success : colors.text3;

  return (
    <Card variant="elevated" padding="lg">
      {/* Top row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ gap: spacing.xs }}>
          <Text size="xs" color="3" weight="medium">ACTIONS TAKEN FOR YOU</Text>
          <Text size="2xl" weight="bold">{totalEvents}</Text>
        </View>
        <View style={{
          flexDirection: "row", alignItems: "center", gap: spacing.xs,
          paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
          borderRadius: radius.full,
          backgroundColor: `${statusColor}18`,
          borderWidth: 1, borderColor: `${statusColor}35`,
        }}>
          <View style={{ width: 6, height: 6, borderRadius: radius.full, backgroundColor: statusColor }} />
          <Text size="xs" weight="semibold" style={{ color: statusColor }}>
            {automationOn ? "Active" : "Paused"}
          </Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.lg }} />

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ gap: 2 }}>
          <Text size="xs" color="3">Last action</Text>
          <Text size="sm" weight="medium">{formatRelativeTime(snapshot.lastEventTimestamp)}</Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.lg }} />

      {/* Feed Personalization toggle — writes to user_settings */}
      <Pressable
        onPress={() => !isPending && toggle(!automationOn)}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        accessibilityRole="switch"
        accessibilityState={{ checked: automationOn }}
        accessibilityLabel={automationOn ? "Pause feed personalisation" : "Start feed personalisation"}
        disabled={isPending}
      >
        <View style={{ gap: 2 }}>
          <Text size="sm" weight="semibold">Feed Personalization</Text>
          <Text size="xs" color="3">{automationOn ? "Running — tap to pause" : "Paused — tap to start"}</Text>
        </View>
        {isPending
          ? <ActivityIndicator size="small" color={colors.primary} />
          : (
            <View style={{
              width: 48, height: 26, borderRadius: radius.full,
              backgroundColor: automationOn ? colors.primary : colors.border,
              justifyContent: "center", paddingHorizontal: 3,
              alignItems: automationOn ? "flex-end" : "flex-start",
            }}>
              <View style={{ width: 20, height: 20, borderRadius: radius.full, backgroundColor: colors.text1 }} />
            </View>
          )
        }
      </Pressable>
    </Card>
  );
});
