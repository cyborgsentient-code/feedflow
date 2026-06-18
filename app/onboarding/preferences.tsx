import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { colors, spacing, radius } from "@/constants/theme";
import { INTERESTS } from "@/features/onboarding/constants/interests";
import { useOnboardingDraft } from "@/features/onboarding/context/OnboardingDraftContext";

export default function OnboardingPreferences() {
  const { draft } = useOnboardingDraft();
  const selectedInterests = INTERESTS.filter(i => draft.interests.includes(i.slug));
  const selectedDisinterests = INTERESTS.filter(i => draft.disinterests.includes(i.slug));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing["2xl"], gap: spacing["2xl"], flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: spacing.sm }}>
          <Text size="2xl" weight="bold">Your setup</Text>
          <Text size="base" color="2">Here's what FeedFlow will personalise for you.</Text>
        </View>

        {/* Interests summary */}
        <Card variant="bordered" padding="lg">
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Text size="base">✅</Text>
              <Text size="sm" weight="semibold">Seeing more of</Text>
            </View>
            {selectedInterests.length === 0 ? (
              <Text size="sm" color="3">No interests selected</Text>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {selectedInterests.map(item => (
                  <View key={item.slug} style={{
                    paddingHorizontal: spacing.sm, paddingVertical: 4,
                    borderRadius: radius.full,
                    backgroundColor: `${colors.primary}20`,
                    flexDirection: "row", alignItems: "center", gap: 4,
                  }}>
                    <Text style={{ fontSize: 12 }}>{item.emoji}</Text>
                    <Text size="xs" weight="medium" style={{ color: colors.primary }}>{item.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Card>

        {/* Disinterests summary */}
        {selectedDisinterests.length > 0 && (
          <Card variant="bordered" padding="lg">
            <View style={{ gap: spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Text size="base">🚫</Text>
                <Text size="sm" weight="semibold">Reducing</Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {selectedDisinterests.map(item => (
                  <View key={item.slug} style={{
                    paddingHorizontal: spacing.sm, paddingVertical: 4,
                    borderRadius: radius.full,
                    backgroundColor: `${colors.warning}20`,
                    flexDirection: "row", alignItems: "center", gap: 4,
                  }}>
                    <Text style={{ fontSize: 12 }}>{item.emoji}</Text>
                    <Text size="xs" weight="medium" style={{ color: colors.warning }}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        )}

        {/* How it works */}
        <Card variant="bordered" padding="lg">
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Text size="base">🤖</Text>
              <Text size="sm" weight="semibold">How it works</Text>
            </View>
            <View style={{ gap: spacing.sm }}>
              {[
                "FeedFlow runs in the background every 30 minutes",
                "It engages with content matching your interests",
                "Instagram's algorithm learns your preferences over time",
                "Your feed becomes more relevant with each cycle",
              ].map((line, i) => (
                <View key={i} style={{ flexDirection: "row", gap: spacing.sm }}>
                  <Text size="xs" color="3">{i + 1}.</Text>
                  <Text size="xs" color="2">{line}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        <View style={{ flex: 1 }} />

        <Button
          label="Activate Personalisation"
          size="lg"
          fullWidth
          onPress={() => router.push("/onboarding/complete")}
          accessibilityRole="button"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
