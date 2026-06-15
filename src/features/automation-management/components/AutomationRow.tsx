import { memo } from "react";
import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { AutomationStatusBadge } from "./AutomationStatusBadge";
import { colors, spacing } from "@/constants/theme";
import type { Automation } from "../types";

interface AutomationRowProps {
  automation: Automation;
  onPress: (id: string) => void;
}

export const AutomationRow = memo(function AutomationRow({ automation, onPress }: AutomationRowProps) {
  return (
    <Pressable
      onPress={() => onPress(automation.id)}
      accessibilityRole="button"
      accessibilityLabel={`View ${automation.name}`}
    >
      <Card variant="elevated" padding="md">
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text size="base" weight="semibold" numberOfLines={1}>{automation.name}</Text>
            {automation.description ? (
              <Text size="xs" color="3" numberOfLines={1}>{automation.description}</Text>
            ) : null}
          </View>
          <AutomationStatusBadge status={automation.status} />
        </View>
      </Card>
    </Pressable>
  );
});
