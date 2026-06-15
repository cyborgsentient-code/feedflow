import { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { profileWriteService } from "@/services/profile/profileWriteService";
import { onboardingService } from "@/services/profile/onboardingService";
import { useOnboardingDraft } from "@/features/onboarding/context/OnboardingDraftContext";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { colors, spacing } from "@/constants/theme";

type SaveState = "idle" | "saving" | "error";

export default function OnboardingComplete() {
  const { user } = useAuthStore();
  const { draft, reset } = useOnboardingDraft();
  const [state, setState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function completeOnboarding(): Promise<void> {
    if (!user || state === "saving") return;
    setState("saving");
    setErrorMsg(null);

    try {
      await profileWriteService.updateProfile(user.id, { interests: draft.interests });
      await profileWriteService.saveInterestPreferences(user.id, draft.interests);
      const confirmed = await onboardingService.markComplete(user.id);

      if (!confirmed) {
        setState("error");
        setErrorMsg("Could not confirm your setup. Please try again.");
        return;
      }

      reset();
      router.replace("/(tabs)/dashboard");
    } catch {
      setState("error");
      setErrorMsg("Failed to save your preferences. Please try again.");
    }
  }

  if (state === "saving") {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.base, justifyContent: "center", alignItems: "center", gap: spacing.xl }}
        accessible
        accessibilityLabel="Saving your preferences"
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text size="sm" color="3">Setting up your feed…</Text>
      </SafeAreaView>
    );
  }

  if (state === "error") {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.base, justifyContent: "center", alignItems: "center", padding: spacing["2xl"], gap: spacing["2xl"] }}
      >
        <View style={{ alignItems: "center", gap: spacing.md }}>
          <Text size="xl" weight="bold">Something went wrong</Text>
          <Text size="base" color="2" style={{ textAlign: "center" }}>{errorMsg}</Text>
        </View>
        <Button label="Retry" size="lg" fullWidth onPress={completeOnboarding} accessibilityRole="button" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.base, justifyContent: "center", alignItems: "center", padding: spacing["2xl"] }}
      accessibilityLiveRegion="polite"
    >
      <View style={{ alignItems: "center", gap: spacing["2xl"] }}>
        <Text size="2xl">🎉</Text>
        <View style={{ alignItems: "center", gap: spacing.sm }}>
          <Text size="xl" weight="bold">You're all set</Text>
          <Text size="base" color="2" style={{ textAlign: "center" }}>
            Your personalised feed is ready.
          </Text>
        </View>
        <Button
          label="Go to Dashboard"
          size="lg"
          fullWidth
          onPress={completeOnboarding}
          accessibilityRole="button"
          accessibilityLabel="Save and go to dashboard"
        />
      </View>
    </SafeAreaView>
  );
}
