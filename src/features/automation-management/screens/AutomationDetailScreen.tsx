import { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAutomation, useExecutionHistory, useToggleAutomation, useDeleteAutomation } from "../hooks/useAutomations";
import { AutomationStatusBadge } from "../components/AutomationStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { colors, spacing } from "@/constants/theme";
import type { Execution } from "../types";

interface Props { id: string }

function ExecutionRow({ exec }: { exec: Execution }) {
  const color = exec.status === "success" ? colors.success : exec.status === "failed" ? colors.error : colors.warning;
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm }}>
      <View style={{ gap: 2 }}>
        <Text size="sm" weight="medium" style={{ color }}>{exec.status}</Text>
        <Text size="xs" color="3">{new Date(exec.startedAt).toLocaleString()}</Text>
      </View>
      {exec.result ? <Text size="xs" color="3" numberOfLines={1}>{exec.result}</Text> : null}
    </View>
  );
}

export default function AutomationDetailScreen({ id }: Props) {
  const { data: automation, isLoading, error } = useAutomation(id);
  const { data: history } = useExecutionHistory(id);
  const toggle = useToggleAutomation();
  const del = useDeleteAutomation();

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.base, justifyContent: "center", alignItems: "center" }}>
        <Text size="sm" color="3">Loading…</Text>
      </SafeAreaView>
    );
  }

  if (error || !automation) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.base, justifyContent: "center", alignItems: "center", padding: spacing["2xl"] }}>
        <Text size="base" color="error" style={{ textAlign: "center" }}>{error?.message ?? "Automation not found"}</Text>
        <Button label="Go Back" variant="ghost" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const isActive = automation.status === "active";
  // H3: one mutation at a time — any pending action locks all action buttons
  const isMutating = toggle.isPending || del.isPending;

  function confirmDelete() {
    Alert.alert(
      "Delete automation",
      "This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await del.mutateAsync(id);
            router.back();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text size="xl" weight="bold" numberOfLines={2}>{automation.name}</Text>
            {automation.description ? <Text size="sm" color="2">{automation.description}</Text> : null}
          </View>
          <AutomationStatusBadge status={automation.status} />
        </View>

        {/* Actions */}
        <View style={{ gap: spacing.md }}>
          <Button
            label={isActive ? "Disable" : "Enable"}
            variant={isActive ? "secondary" : "primary"}
            fullWidth
            loading={toggle.isPending}
            disabled={isMutating}
            onPress={() => toggle.mutate({ id, enable: !isActive })}
            accessibilityLabel={isActive ? "Disable automation" : "Enable automation"}
          />
          <Button
            label="Edit"
            variant="secondary"
            fullWidth
            disabled={isMutating}
            onPress={() => router.push(`/automations/${id}/edit`)}
            accessibilityLabel="Edit automation"
          />
          <Button
            label="Delete"
            variant="danger"
            fullWidth
            loading={del.isPending}
            disabled={isMutating}
            onPress={confirmDelete}
            accessibilityLabel="Delete automation"
          />
        </View>

        {/* Execution history */}
        <View style={{ gap: spacing.md }}>
          <Text size="sm" weight="semibold" color="2">Execution history</Text>
          {!history || history.length === 0 ? (
            <Text size="sm" color="3">No executions yet.</Text>
          ) : (
            <Card variant="bordered" padding="md">
              <View style={{ gap: 0 }}>
                {history.map((exec, i) => (
                  <View key={exec.id}>
                    {i > 0 && <View style={{ height: 1, backgroundColor: colors.border }} />}
                    <ExecutionRow exec={exec} />
                  </View>
                ))}
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
