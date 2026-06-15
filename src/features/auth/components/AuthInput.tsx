import React, { forwardRef } from "react";
import {
  TextInput,
  View,
  Pressable,
  type TextInputProps,
} from "react-native";
import { Text } from "@/components/ui/Text";
import { colors, radius, spacing } from "@/constants/theme";

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export const AuthInput = forwardRef<TextInput, AuthInputProps>(
  ({ label, error, rightElement, ...props }, ref) => {
    return (
      <View style={{ gap: spacing.xs }}>
        <Text size="sm" weight="medium" color="2">
          {label}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.elevated,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: error ? colors.error : colors.border,
            paddingHorizontal: spacing.lg,
          }}
        >
          <TextInput
            ref={ref}
            placeholderTextColor={colors.text3}
            style={{
              flex: 1,
              color: colors.text1,
              fontSize: 16,
              paddingVertical: spacing.lg,
            }}
            autoCapitalize="none"
            autoCorrect={false}
            {...props}
          />
          {rightElement && (
            <View style={{ paddingLeft: spacing.sm }}>{rightElement}</View>
          )}
        </View>
        {error ? (
          <Text size="xs" color="error">
            {error}
          </Text>
        ) : null}
      </View>
    );
  }
);

AuthInput.displayName = "AuthInput";
