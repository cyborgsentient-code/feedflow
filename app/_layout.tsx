import "../global.css";
import React, { useEffect } from "react";
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

  useEffect(() => {
    let splashHidden = false;

    const unsubscribe = authService.onAuthStateChange(async (event, session) => {
      console.log("[_layout] onAuthStateChange event:", event, "user:", session?.user?.id ?? null);
      setSession(session);

      if (!splashHidden) {
        splashHidden = true;
        SplashScreen.hideAsync();
      }

      if (event === "SIGNED_OUT") {
        // Ignore spurious SIGNED_OUT that Supabase fires when a new sign-in
        // invalidates the previous session token
        setTimeout(() => {
          const current = useAuthStore.getState().session;
          if (!current) {
            console.log("[_layout] confirmed sign out → /sign-in");
            router.replace("/sign-in");
          } else {
            console.log("[_layout] spurious SIGNED_OUT ignored, session exists");
          }
        }, 200);
        return;
      }

      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        try {
          const profile = await profileService.getOnboardingStatus(session.user.id);
          console.log("[_layout] profile onboarding_complete:", profile.onboarding_complete);
          if (profile.onboarding_complete) {
            router.replace("/(tabs)/dashboard");
          } else {
            router.replace("/onboarding");
          }
        } catch (e) {
          console.log("[_layout] profile fetch failed, going to onboarding:", e);
          router.replace("/onboarding");
        }
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
