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
    queryFn: () => profileService.getOnboardingStatus(session!.user.id),
    enabled: !!session,
    staleTime: Infinity,
  });

  // Fire-and-forget bootstrap: guarantees demo state before dashboard loads.
  // Runs only when user has completed onboarding.
  useEffect(() => {
    if (session?.user.id && profile?.onboarding_complete) {
      journeyService.bootstrap(session.user.id);
    }
  }, [session?.user.id, profile?.onboarding_complete]);

  if (isLoading || (session && profileLoading)) return null;
  if (!session) return <Redirect href="/sign-in" />;
  if (!profile?.onboarding_complete) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/dashboard" />;
}
