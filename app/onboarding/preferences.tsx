import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { colors, spacing, radius } from "@/constants/theme";

export default function OnboardingPreferences() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }}>
      <View style={{ flex: 1, padding: spacing["2xl"], gap: spacing["3xl"], justifyContent: "center" }}>
        <View style={{ gap: spacing.sm }}>
          <Text size="2xl" weight="bold">Your experience</Text>
          <Text size="base" color="2">FeedFlow is built for focus. Here's what you'll get.</Text>
        </View>

        <View style={{ gap: spacing.lg }}>
          <Card variant="bordered" padding="lg">
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: `${colors.primary}20`, justifyContent: "center", alignItems: "center" }}>
                <Text size="lg">🌙</Text>
              </View>
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Text size="base" weight="semibold">Dark mode</Text>
                <Text size="sm" color="2">Easy on the eyes, always on.</Text>
              </View>
              <View style={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: `${colors.primary}20` }}>
                <Text size="xs" color="primary" weight="semibold">Default</Text>
              </View>
            </View>
          </Card>

          <Card variant="bordered" padding="lg">
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: `${colors.success}20`, justifyContent: "center", alignItems: "center" }}>
                <Text size="lg">🤖</Text>
              </View>
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Text size="base" weight="semibold">Smart automation</Text>
                <Text size="sm" color="2">We learn what you like and curate better over time.</Text>
              </View>
            </View>
          </Card>
        </View>

        <Button
          label="Looks good"
          size="lg"
          fullWidth
          onPress={() => router.push("/onboarding/complete")}
          accessibilityRole="button"
          accessibilityLabel="Continue to final step"
        />
      </View>
    </SafeAreaView>
  );
}
