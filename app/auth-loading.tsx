import { View, ActivityIndicator } from "react-native";
import { colors, spacing } from "@/constants/theme";
import { Text } from "@/components/ui/Text";

export default function AuthLoadingScreen() {
  return (
    <View
      style={{ flex: 1, backgroundColor: colors.base, justifyContent: "center", alignItems: "center", gap: spacing.xl }}
      accessible
      accessibilityLabel="Loading, please wait"
    >
      <View style={{ alignItems: "center", gap: spacing.xl }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text size="sm" color="3">Loading…</Text>
      </View>
    </View>
  );
}
