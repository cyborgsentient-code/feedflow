import { memo } from "react";
import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { SourceStatusBadge } from "./SourceStatusBadge";
import { spacing } from "@/constants/theme";
import type { Source } from "../types";

interface SourceRowProps {
  source: Source;
  onPress: (id: string) => void;
}

export const SourceRow = memo(function SourceRow({ source, onPress }: SourceRowProps) {
  return (
    <Pressable
      onPress={() => onPress(source.id)}
      accessibilityRole="button"
      accessibilityLabel={`View ${source.name}`}
    >
      <Card variant="elevated" padding="md">
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text size="base" weight="semibold" numberOfLines={1}>{source.name}</Text>
            <Text size="xs" color="3">{source.platform}</Text>
          </View>
          <SourceStatusBadge status={source.status} />
        </View>
      </Card>
    </Pressable>
  );
});
