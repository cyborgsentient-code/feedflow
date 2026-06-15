import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/Text";
import { spacing } from "@/constants/theme";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text size="2xl" weight="bold" color="1">
        {title}
      </Text>
      <Text size="base" color="2">
        {subtitle}
      </Text>
    </View>
  );
}
