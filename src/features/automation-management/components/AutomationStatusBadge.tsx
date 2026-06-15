import { memo } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/Text";
import { colors, spacing, radius } from "@/constants/theme";
import type { AutomationStatus } from "../types";

const CONFIG: Record<AutomationStatus, { label: string; dot: string; bg: string; textColor: string }> = {
  active:   { label: "Active",   dot: colors.success,  bg: `${colors.success}15`,  textColor: colors.success },
  disabled: { label: "Disabled", dot: colors.text3,    bg: colors.elevated,         textColor: colors.text2 },
  draft:    { label: "Draft",    dot: colors.warning,  bg: `${colors.warning}15`,  textColor: colors.warning },
};

export const AutomationStatusBadge = memo(function AutomationStatusBadge({
  status,
}: {
  status: AutomationStatus;
}) {
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
