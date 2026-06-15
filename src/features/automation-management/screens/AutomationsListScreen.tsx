import { View, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAutomations } from "../hooks/useAutomations";
import { AutomationRow } from "../components/AutomationRow";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { colors, spacing } from "@/constants/theme";
import type { Automation } from "../types";

export default function AutomationsListScreen() {
  const { data: automations, isLoading, error } = useAutomations();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }} edges={["top"]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text size="xl" weight="bold">Automations</Text>
        <Button
          label="New"
          size="sm"
          onPress={() => router.push("/automations/create")}
          accessibilityLabel="Create new automation"
        />
      </View>

      {isLoading && (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text size="sm" color="3">Loading…</Text>
        </View>
      )}

      {error && (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: spacing["2xl"] }}>
          <Text size="base" color="error" style={{ textAlign: "center" }}>{error.message}</Text>
        </View>
      )}

      {!isLoading && !error && automations?.length === 0 && (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.lg, padding: spacing["2xl"] }}>
          <Text size="lg">🤖</Text>
          <Text size="base" weight="semibold">No automations yet</Text>
          <Text size="sm" color="2" style={{ textAlign: "center" }}>
            Create your first automation to start curating your feed.
          </Text>
          <Button label="Create Automation" onPress={() => router.push("/automations/create")} />
        </View>
      )}

      {automations && automations.length > 0 && (
        <FlatList
          data={automations}
          keyExtractor={(item: Automation) => item.id}
          renderItem={({ item }) => (
            <AutomationRow
              automation={item}
              onPress={(id) => router.push(`/automations/${id}`)}
            />
          )}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
