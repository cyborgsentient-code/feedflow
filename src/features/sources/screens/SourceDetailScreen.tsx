import { View, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useSource, useSetSourceStatus, useDeleteSource } from "../hooks/useSources";
import { SourceStatusBadge } from "../components/SourceStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { colors, spacing } from "@/constants/theme";

interface Props { id: string }

export default function SourceDetailScreen({ id }: Props) {
  const { data: source, isLoading, error } = useSource(id);
  const setStatus = useSetSourceStatus();
  const del = useDeleteSource();

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.base, justifyContent: "center", alignItems: "center" }}>
        <Text size="sm" color="3">Loading…</Text>
      </SafeAreaView>
    );
  }

  if (error || !source) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.base, justifyContent: "center", alignItems: "center", padding: spacing["2xl"] }}>
        <Text size="base" color="error" style={{ textAlign: "center" }}>{error?.message ?? "Source not found"}</Text>
        <Button label="Go Back" variant="ghost" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const isMutating = setStatus.isPending || del.isPending;
  const isActive = source.status === "active";

  function confirmDelete() {
    Alert.alert("Delete source", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await del.mutateAsync(id);
          router.back();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text size="xl" weight="bold" numberOfLines={2}>{source.name}</Text>
            <Text size="sm" color="3">{source.platform}</Text>
          </View>
          <SourceStatusBadge status={source.status} />
        </View>

        {/* Metadata */}
        <Card variant="bordered" padding="md">
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text size="sm" color="3">Created</Text>
              <Text size="sm">{new Date(source.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text size="sm" color="3">Updated</Text>
              <Text size="sm">{new Date(source.updatedAt).toLocaleDateString()}</Text>
            </View>
          </View>
        </Card>

        {/* Actions */}
        <View style={{ gap: spacing.md }}>
          <Button
            label={isActive ? "Pause" : "Activate"}
            variant={isActive ? "secondary" : "primary"}
            fullWidth
            loading={setStatus.isPending}
            disabled={isMutating}
            onPress={() => setStatus.mutate({ id, status: isActive ? "paused" : "active" })}
            accessibilityLabel={isActive ? "Pause source" : "Activate source"}
          />
          <Button
            label="Delete"
            variant="danger"
            fullWidth
            loading={del.isPending}
            disabled={isMutating}
            onPress={confirmDelete}
            accessibilityLabel="Delete source"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
