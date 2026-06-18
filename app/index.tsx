import { useEffect } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { profileService } from "@/services/profileService";
import { journeyService } from "@/services/journeyService";

export default function Index() {
  const { session, isLoading } = useAuthStore();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", session?.user.id],
    queryFn: async () => {
      try {
        return await profileService.getOnboardingStatus(session!.user.id);
      } catch {
        return { onboarding_complete: false };
      }
    },
    enabled: !!session,
    retry: false,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!session) { router.replace("/sign-in"); return; }
    if (profileLoading) return;
    if (profile?.onboarding_complete) {
      journeyService.bootstrap(session.user.id).catch(() => {});
      router.replace("/(tabs)/dashboard");
    } else {
      router.replace("/onboarding");
    }
  }, [isLoading, session?.user.id, profileLoading, profile?.onboarding_complete]);

  return null;
}
