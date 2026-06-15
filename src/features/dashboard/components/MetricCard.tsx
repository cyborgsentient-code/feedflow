import { memo } from "react";
import { View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { colors, spacing } from "@/constants/theme";

interface MetricCardProps {
  label: string;
  value: string | number;
  emoji: string;
  accent?: string;
}

export const MetricCard = memo(function MetricCard({ label, value, emoji, accent }: MetricCardProps) {
  return (
    <Card variant="elevated" padding="md" style={{ flex: 1 }}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text size="lg">{emoji}</Text>
          {accent && (
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent }} />
          )}
        </View>
        <Text size="xl" weight="bold">{value}</Text>
        <Text size="xs" color="3" weight="medium">{label}</Text>
      </View>
    </Card>
  );
});
