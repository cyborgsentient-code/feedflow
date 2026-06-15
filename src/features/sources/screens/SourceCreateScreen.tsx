import { View, KeyboardAvoidingView, ScrollView, Platform, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateSource } from "../hooks/useSources";
import { sourceCreateSchema, PLATFORMS, type SourceCreateValues } from "../validators";
import { AuthInput } from "@/features/auth/components/AuthInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { colors, spacing } from "@/constants/theme";

export default function SourceCreateScreen() {
  const create = useCreateSource();

  const form = useForm<SourceCreateValues>({
    resolver: zodResolver(sourceCreateSchema),
    defaultValues: { name: "", platform: "rss" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await create.mutateAsync(values);
    if (!result.success) return;
    router.replace(`/sources/${result.data.id}`);
  });

  const isDisabled = form.formState.isSubmitting || create.isPending;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }} keyboardShouldPersistTaps="handled">
          <Text size="xl" weight="bold">New Source</Text>

          <View style={{ gap: spacing.xl }}>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <AuthInput
                  label="Name"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  placeholder="e.g. Tech News"
                  returnKeyType="done"
                  onSubmitEditing={isDisabled ? undefined : onSubmit}
                  editable={!isDisabled}
                  accessible
                  accessibilityLabel="Source name"
                />
              )}
            />

            <Controller
              control={form.control}
              name="platform"
              render={({ field, fieldState }) => (
                <View style={{ gap: spacing.xs }}>
                  <Text size="sm" weight="medium" color="2">Platform</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                    {PLATFORMS.map((p) => {
                      const selected = field.value === p;
                      return (
                        <Pressable
                          key={p}
                          onPress={() => !isDisabled && field.onChange(p)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          accessibilityLabel={p}
                        >
                          <Card
                            variant={selected ? "bordered" : "elevated"}
                            padding="sm"
                            style={selected ? { borderColor: colors.primary } : undefined}
                          >
                            <Text size="sm" weight={selected ? "semibold" : "regular"} style={selected ? { color: colors.primary } : undefined}>
                              {p}
                            </Text>
                          </Card>
                        </Pressable>
                      );
                    })}
                  </View>
                  {fieldState.error && <Text size="xs" color="error">{fieldState.error.message}</Text>}
                </View>
              )}
            />

            {create.error && (
              <View
                style={{ backgroundColor: `${colors.error}15`, borderRadius: 10, padding: spacing.md, borderWidth: 1, borderColor: `${colors.error}30` }}
                accessibilityRole="alert"
              >
                <Text size="sm" color="error">{create.error.message}</Text>
              </View>
            )}

            <Button label="Add Source" size="lg" fullWidth loading={isDisabled} disabled={isDisabled} onPress={onSubmit} accessibilityRole="button" />
            <Button label="Cancel" variant="ghost" size="md" fullWidth disabled={isDisabled} onPress={() => router.back()} accessibilityRole="button" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
