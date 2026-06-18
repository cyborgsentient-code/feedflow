import { useEffect } from "react";
import { Redirect } from "expo-router";
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
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (session?.user.id && profile?.onboarding_complete) {
      journeyService.bootstrap(session.user.id).catch(() => {});
    }
  }, [session?.user.id, profile?.onboarding_complete]);

  if (isLoading || (session && profileLoading)) return null;
  if (!session) return <Redirect href="/sign-in" />;
  if (!profile?.onboarding_complete) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/dashboard" />;
}
