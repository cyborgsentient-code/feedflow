import { View } from "react-native";
import { Text } from "@/components/ui/Text";
import { colors, spacing, radius } from "@/constants/theme";

export function EmptyFeedState() {
  return (
    <View
      style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: spacing["3xl"], gap: spacing["2xl"] }}
      accessibilityRole="none"
      accessibilityLabel="No events yet"
    >
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: radius.full,
          backgroundColor: `${colors.primary}15`,
          borderWidth: 1.5,
          borderColor: `${colors.primary}30`,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text size="2xl">📡</Text>
      </View>

      <View style={{ alignItems: "center", gap: spacing.sm }}>
        <Text size="lg" weight="semibold">Your feed is being personalised</Text>
        <Text size="sm" color="2" style={{ textAlign: "center", lineHeight: 20 }}>
          FeedFlow is working in the background. Actions taken on your behalf will appear here.
        </Text>
      </View>

      <View
        style={{
          paddingHorizontal: spacing["2xl"],
          paddingVertical: spacing.md,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.elevated,
        }}
        accessibilityRole="none"
      >
        <Text size="sm" color="3">Feed updates automatically</Text>
      </View>
    </View>
  );
}
