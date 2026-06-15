import { Stack } from "expo-router";
import { OnboardingDraftProvider } from "@/features/onboarding/context/OnboardingDraftContext";

export default function OnboardingLayout() {
  return (
    <OnboardingDraftProvider>
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />
    </OnboardingDraftProvider>
  );
}
