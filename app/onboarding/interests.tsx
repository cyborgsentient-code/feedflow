import { useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { colors, spacing, radius } from "@/constants/theme";
import { INTERESTS, MIN_INTERESTS, MAX_INTERESTS } from "@/features/onboarding/constants/interests";
import { useOnboardingDraft } from "@/features/onboarding/context/OnboardingDraftContext";

export default function OnboardingInterests() {
  const { setInterests } = useOnboardingDraft();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(slug: string) {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_INTERESTS) return prev;
      return [...prev, slug];
    });
  }

  const tooFew = selected.length < MIN_INTERESTS;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing["2xl"], gap: spacing["2xl"] }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: spacing.sm }}>
          <Text size="2xl" weight="bold">Pick your interests</Text>
          <Text size="base" color="2">
            Choose {MIN_INTERESTS}–{MAX_INTERESTS} topics to personalise your feed.
          </Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          {INTERESTS.map((item) => {
            const active = selected.includes(item.slug);
            return (
              <Pressable
                key={item.slug}
                onPress={() => toggle(item.slug)}
                style={{
                  width: "30%",
                  paddingVertical: spacing.lg,
                  paddingHorizontal: spacing.sm,
                  borderRadius: radius.lg,
                  borderWidth: 1.5,
                  alignItems: "center",
                  gap: spacing.xs,
                  backgroundColor: active ? `${colors.primary}20` : colors.elevated,
                  borderColor: active ? colors.primary : colors.border,
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                accessibilityLabel={item.label}
              >
                <Text size="lg">{item.emoji}</Text>
                <Text size="xs" weight="medium" color={active ? "primary" : "2"}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text size="sm" color="3" style={{ textAlign: "center" }}>
            {selected.length} / {MAX_INTERESTS} selected
          </Text>
          {tooFew && selected.length > 0 && (
            <Text size="sm" color="error" style={{ textAlign: "center" }}>
              Select at least {MIN_INTERESTS} interests to continue.
            </Text>
          )}
        </View>

        <Button
          label="Continue"
          size="lg"
          fullWidth
          disabled={tooFew}
          onPress={() => {
            setInterests(selected);
            router.push("/onboarding/connect-instagram");
          }}
          accessibilityRole="button"
          accessibilityLabel="Continue to preferences"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
