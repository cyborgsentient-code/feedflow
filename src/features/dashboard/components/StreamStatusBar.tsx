import { memo, useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { Text } from "@/components/ui/Text";
import { colors, spacing, radius } from "@/constants/theme";
import type { StreamSnapshot } from "@/features/automation/types/event";

function PulseDot({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return <Animated.View style={[{ width: 8, height: 8, borderRadius: radius.full, backgroundColor: color }, { opacity }]} />;
}

export const StreamStatusBar = memo(function StreamStatusBar({ snapshot }: { snapshot: StreamSnapshot }) {
  const { recoveryState, isStale } = snapshot;

  if (recoveryState === "corrupted") {
    return (
      <View
        style={{ backgroundColor: `${colors.error}18`, borderBottomWidth: 1, borderBottomColor: `${colors.error}35`, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm }}
        accessibilityRole="alert"
      >
        <View style={{ width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.error }} />
        <Text size="xs" color="error" weight="medium">Automation paused — tap to reconnect</Text>
      </View>
    );
  }

  if (recoveryState === "recovering" || recoveryState === "degraded") {
    return (
      <View style={{ backgroundColor: `${colors.warning}18`, borderBottomWidth: 1, borderBottomColor: `${colors.warning}35`, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <PulseDot color={colors.warning} />
        <Text size="xs" color="warning" weight="medium">Reconnecting your feed…</Text>
      </View>
    );
  }

  if (recoveryState === "repaired") {
    return (
      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View style={{ width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.success }} />
        <Text size="xs" style={{ color: colors.success }} weight="medium">Back online — personalisation active</Text>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <PulseDot color={isStale ? colors.warning : colors.success} />
      <Text size="xs" style={{ color: isStale ? colors.warning : colors.success }} weight="medium">
        {isStale ? "Personalisation active — waiting for next action" : "Personalisation active"}
      </Text>
    </View>
  );
});
