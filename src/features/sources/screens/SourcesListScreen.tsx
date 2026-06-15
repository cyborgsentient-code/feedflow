import { View, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useSources } from "../hooks/useSources";
import { SourceRow } from "../components/SourceRow";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { colors, spacing } from "@/constants/theme";
import type { Source } from "../types";

export default function SourcesListScreen() {
  const { data: sources, isLoading, error } = useSources();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text size="xl" weight="bold">Sources</Text>
        <Button label="New" size="sm" onPress={() => router.push("/sources/create")} accessibilityLabel="Add new source" />
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

      {!isLoading && !error && sources?.length === 0 && (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.lg, padding: spacing["2xl"] }}>
          <Text size="lg">📡</Text>
          <Text size="base" weight="semibold">No sources yet</Text>
          <Text size="sm" color="2" style={{ textAlign: "center" }}>Add your first source to start building your feed.</Text>
          <Button label="Add Source" onPress={() => router.push("/sources/create")} />
        </View>
      )}

      {sources && sources.length > 0 && (
        <FlatList
          data={sources}
          keyExtractor={(item: Source) => item.id}
          renderItem={({ item }) => (
            <SourceRow source={item} onPress={(id) => router.push(`/sources/${id}`)} />
          )}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
