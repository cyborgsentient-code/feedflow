import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { colors, spacing } from "@/constants/theme";

export default function OnboardingWelcome() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: spacing["2xl"],
          gap: spacing["3xl"],
        }}
      >
        <View style={{ alignItems: "center", gap: spacing.lg }}>
          <Text size="2xl" style={{ textAlign: "center" }}>📱</Text>
          <Text size="2xl" weight="bold" style={{ textAlign: "center" }}>
            Welcome to FeedFlow
          </Text>
          <Text size="base" color="2" style={{ textAlign: "center", lineHeight: 24 }}>
            FeedFlow improves your Instagram feed by automatically engaging with content aligned to your interests.
          </Text>
        </View>

        <Button
          label="Get Started"
          size="lg"
          fullWidth
          onPress={() => router.push("/onboarding/interests")}
          accessibilityRole="button"
          accessibilityLabel="Get started with onboarding"
        />
      </View>
    </SafeAreaView>
  );
}
