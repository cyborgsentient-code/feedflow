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

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { setSession } = useAuthStore();

  useEffect(() => {
    // INITIAL_SESSION fires synchronously on mount — single source of truth.
    // splashHidden ref ensures we only call hideAsync once, preventing flicker
    // on subsequent SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED events.
    let splashHidden = false;

    const unsubscribe = authService.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!splashHidden) {
        splashHidden = true;
        SplashScreen.hideAsync();
      }
      // Drive navigation on auth state changes after splash is hidden
      if (splashHidden) {
        if (!session) {
          router.replace("/sign-in");
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
