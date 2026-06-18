import { useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { colors, spacing, radius } from "@/constants/theme";
import { INTERESTS, MIN_INTERESTS, MAX_INTERESTS } from "@/features/onboarding/constants/interests";
import { useOnboardingDraft } from "@/features/onboarding/context/OnboardingDraftContext";

function InterestGrid({
  selected, onToggle, max, accentColor, borderSelected,
}: {
  selected: string[];
  onToggle: (slug: string) => void;
  max: number;
  accentColor: string;
  borderSelected: string;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
      {INTERESTS.map((item) => {
        const active = selected.includes(item.slug);
        const atMax = !active && selected.length >= max;
        return (
          <Pressable
            key={item.slug}
            onPress={() => !atMax && onToggle(item.slug)}
            style={{
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.md,
              borderRadius: radius.lg,
              borderWidth: 1.5,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
              backgroundColor: active ? `${accentColor}20` : colors.elevated,
              borderColor: active ? borderSelected : colors.border,
              opacity: atMax ? 0.4 : 1,
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: active }}
            accessibilityLabel={item.label}
          >
            <Text style={{ fontSize: 14 }}>{item.emoji}</Text>
            <Text size="xs" weight="medium" style={{ color: active ? accentColor : colors.text2 }}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function OnboardingInterests() {
  const { setInterests, setDisinterests } = useOnboardingDraft();
  const [selected, setSelected] = useState<string[]>([]);
  const [reduced, setReduced] = useState<string[]>([]);

  function toggle(slug: string, list: string[], setList: (v: string[]) => void, max: number) {
    setList(list.includes(slug) ? list.filter((s) => s !== slug) : list.length < max ? [...list, slug] : list);
  }

  const tooFew = selected.length < MIN_INTERESTS;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing["2xl"], gap: spacing["2xl"], paddingBottom: spacing["5xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ gap: spacing.xs }}>
          <Text size="2xl" weight="bold">Personalise your feed</Text>
          <Text size="base" color="2">Tell FeedFlow what to show more of — and what to avoid.</Text>
        </View>

        {/* More of */}
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ gap: 2 }}>
              <Text size="base" weight="semibold">See more of</Text>
              <Text size="sm" color="2">Pick {MIN_INTERESTS}–{MAX_INTERESTS} topics</Text>
            </View>
            <View style={{
              paddingHorizontal: spacing.sm, paddingVertical: 3,
              borderRadius: radius.full,
              backgroundColor: selected.length >= MIN_INTERESTS ? `${colors.success}20` : `${colors.primary}20`,
            }}>
              <Text size="xs" weight="semibold" style={{
                color: selected.length >= MIN_INTERESTS ? colors.success : colors.primary,
              }}>
                {selected.length}/{MAX_INTERESTS}
              </Text>
            </View>
          </View>
          <InterestGrid
            selected={selected}
            onToggle={(slug) => toggle(slug, selected, setSelected, MAX_INTERESTS)}
            max={MAX_INTERESTS}
            accentColor={colors.primary}
            borderSelected={colors.primary}
          />
        </View>

        {/* Less of */}
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ gap: 2 }}>
              <Text size="base" weight="semibold">See less of</Text>
              <Text size="sm" color="2">Optional — skip if none apply</Text>
            </View>
            {reduced.length > 0 && (
              <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full, backgroundColor: `${colors.warning}20` }}>
                <Text size="xs" weight="semibold" style={{ color: colors.warning }}>{reduced.length} blocked</Text>
              </View>
            )}
          </View>
          <InterestGrid
            selected={reduced}
            onToggle={(slug) => toggle(slug, reduced, setReduced, INTERESTS.length)}
            max={INTERESTS.length}
            accentColor={colors.warning}
            borderSelected={colors.warning}
          />
        </View>

        {tooFew && selected.length > 0 && (
          <Text size="sm" color="error" style={{ textAlign: "center" }}>
            Select at least {MIN_INTERESTS} interests to continue.
          </Text>
        )}

        <Button
          label="Continue"
          size="lg"
          fullWidth
          disabled={tooFew}
          onPress={() => {
            setInterests(selected);
            setDisinterests(reduced);
            router.push("/onboarding/connect-instagram");
          }}
          accessibilityRole="button"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
