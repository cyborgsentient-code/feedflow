import "../global.css";
import React, { useEffect, useRef } from "react";
import { Stack, router } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { queryClient } from "@/lib/queryClient";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import { profileService } from "@/services/profileService";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { setSession } = useAuthStore();
  const lastSignInAt = useRef<number>(0);

  useEffect(() => {
    let splashHidden = false;

    const unsubscribe = authService.onAuthStateChange(async (event, session) => {
      console.log("[_layout] onAuthStateChange event:", event, "user:", session?.user?.id ?? null);
      setSession(session);

      if (!splashHidden) {
        splashHidden = true;
        SplashScreen.hideAsync();
      }

      if (event === "SIGNED_IN" && session) {
        lastSignInAt.current = Date.now();
        useAuthStore.setState((s) => ({ sessionKey: s.sessionKey + 1 }));
        try {
          const profile = await profileService.getOnboardingStatus(session.user.id);
          console.log("[_layout] profile onboarding_complete:", profile.onboarding_complete);
          router.replace(profile.onboarding_complete ? "/(tabs)/dashboard" : "/onboarding");
        } catch {
          router.replace("/onboarding");
        }
        return;
      }

      if (event === "INITIAL_SESSION") {
        if (session) {
          try {
            const profile = await profileService.getOnboardingStatus(session.user.id);
            router.replace(profile.onboarding_complete ? "/(tabs)/dashboard" : "/onboarding");
          } catch {
            router.replace("/onboarding");
          }
        } else {
          router.replace("/sign-in");
        }
        return;
      }

      if (event === "SIGNED_OUT") {
        // Ignore if a SIGNED_IN happened within the last 2 seconds (spurious Supabase event)
        if (Date.now() - lastSignInAt.current < 2000) {
          console.log("[_layout] spurious SIGNED_OUT ignored");
          return;
        }
        console.log("[_layout] signed out → /sign-in");
        router.replace("/sign-in");
      }
    });

    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
