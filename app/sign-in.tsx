import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { Controller } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react-native";
import { AuthHeader } from "@/features/auth/components/AuthHeader";
import { AuthInput } from "@/features/auth/components/AuthInput";
import { useSignInForm } from "@/features/auth/hooks/useAuthForm";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { colors, spacing } from "@/constants/theme";

export default function SignInScreen() {
  const { form, onSubmit, authError, countdown, isDisabled } = useSignInForm();
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const buttonLabel = countdown > 0 ? `Wait ${countdown}s` : "Sign In";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: spacing["2xl"] }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flex: 1, justifyContent: "center", gap: spacing["3xl"] }}>
            <AuthHeader
              title="Welcome back"
              subtitle="Sign in to continue growing your feed"
            />

            <View style={{ gap: spacing.xl }}>
              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <AuthInput
                    label="Email"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    editable={!isDisabled}
                    accessible
                    accessibilityLabel="Email address"
                  />
                )}
              />

              <Controller
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <AuthInput
                    ref={passwordRef}
                    label="Password"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    returnKeyType="done"
                    onSubmitEditing={isDisabled ? undefined : onSubmit}
                    editable={!isDisabled}
                    accessible
                    accessibilityLabel="Password"
                    rightElement={
                      <Pressable
                        onPress={() => setShowPassword((v) => !v)}
                        accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                        hitSlop={8}
                      >
                        {showPassword
                          ? <EyeOff size={18} color={colors.text3} />
                          : <Eye size={18} color={colors.text3} />}
                      </Pressable>
                    }
                  />
                )}
              />

              {authError && (
                <View
                  style={{
                    backgroundColor: `${colors.error}15`,
                    borderRadius: 10,
                    padding: spacing.md,
                    borderWidth: 1,
                    borderColor: `${colors.error}30`,
                    gap: spacing.xs,
                  }}
                  accessibilityRole="alert"
                >
                  <Text size="sm" color="error">{authError.message}</Text>
                  <Text size="xs" color="3">Try again or check your connection.</Text>
                </View>
              )}

              <Button
                label={buttonLabel}
                onPress={onSubmit}
                loading={form.formState.isSubmitting}
                disabled={isDisabled}
                fullWidth
                size="lg"
                accessibilityRole="button"
              />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "center", gap: spacing.xs }}>
              <Text size="sm" color="2">Don't have an account?</Text>
              <Link href="/sign-up" asChild>
                <Pressable accessibilityRole="link">
                  <Text size="sm" color="primary" weight="semibold">Sign Up</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
