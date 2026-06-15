import { View, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateAutomation } from "../hooks/useAutomations";
import { automationCreateSchema, type AutomationCreateValues } from "../validators";
import { AuthInput } from "@/features/auth/components/AuthInput";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { colors, spacing } from "@/constants/theme";

export default function AutomationCreateScreen() {
  // H2: single useMutation — React Query blocks concurrent calls automatically
  const create = useCreateAutomation();

  const form = useForm<AutomationCreateValues>({
    resolver: zodResolver(automationCreateSchema),
    defaultValues: { name: "", description: "", scheduleHours: 24 },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await create.mutateAsync(values);
    if (!result.success) return;                         // error shown via create.error
    router.replace(`/automations/${result.data.id}`);
  });

  const isDisabled = form.formState.isSubmitting || create.isPending;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }} keyboardShouldPersistTaps="handled">
          <Text size="xl" weight="bold">New Automation</Text>

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
                  placeholder="e.g. Daily feed curation"
                  returnKeyType="next"
                  editable={!isDisabled}
                  accessible
                  accessibilityLabel="Automation name"
                />
              )}
            />

            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <AuthInput
                  label="Description (optional)"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  placeholder="What does this automation do?"
                  returnKeyType="next"
                  editable={!isDisabled}
                  accessible
                  accessibilityLabel="Automation description"
                />
              )}
            />

            <Controller
              control={form.control}
              name="scheduleHours"
              render={({ field, fieldState }) => (
                <AuthInput
                  label="Run every (hours)"
                  value={String(field.value)}
                  onChangeText={(v) => field.onChange(Number(v))}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onSubmitEditing={isDisabled ? undefined : onSubmit}
                  editable={!isDisabled}
                  accessible
                  accessibilityLabel="Schedule in hours"
                />
              )}
            />

            {create.error && (
              <View
                style={{ backgroundColor: `${colors.error}15`, borderRadius: 10, padding: spacing.md, borderWidth: 1, borderColor: `${colors.error}30`, gap: spacing.xs }}
                accessibilityRole="alert"
              >
                <Text size="sm" color="error">{create.error.message}</Text>
                <Text size="xs" color="3">Try again or check your connection.</Text>
              </View>
            )}

            <Button
              label="Create Automation"
              size="lg"
              fullWidth
              loading={isDisabled}
              disabled={isDisabled}
              onPress={onSubmit}
              accessibilityRole="button"
            />

            <Button
              label="Cancel"
              variant="ghost"
              size="md"
              fullWidth
              disabled={isDisabled}
              onPress={() => router.back()}
              accessibilityRole="button"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
