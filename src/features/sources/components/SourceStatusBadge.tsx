import { memo } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/Text";
import { colors, spacing, radius } from "@/constants/theme";
import type { SourceStatus } from "../types";

const CONFIG: Record<SourceStatus, { label: string; dot: string; bg: string; textColor: string }> = {
  active: { label: "Active", dot: colors.success, bg: `${colors.success}15`, textColor: colors.success },
  paused: { label: "Paused", dot: colors.text3,   bg: colors.elevated,        textColor: colors.text2 },
  error:  { label: "Error",  dot: colors.error,   bg: `${colors.error}15`,   textColor: colors.error },
};

export const SourceStatusBadge = memo(function SourceStatusBadge({ status }: { status: SourceStatus }) {
  const c = CONFIG[status];
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full, backgroundColor: c.bg }}
      accessibilityLabel={`Status: ${c.label}`}
    >
      <View style={{ width: 6, height: 6, borderRadius: radius.full, backgroundColor: c.dot }} />
      <Text size="xs" weight="medium" style={{ color: c.textColor }}>{c.label}</Text>
    </View>
  );
});
