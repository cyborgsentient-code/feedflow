import { useRef, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Dimensions,
  Text as RNText,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Text } from "@/components/ui/Text";
import { colors, spacing, radius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    emoji: "✨",
    title: "Take back your feed",
    body: "Instagram's algorithm decides what you see. FeedFlow puts you back in control — automatically.",
    accent: colors.primary,
  },
  {
    emoji: "🎯",
    title: "Choose your interests",
    body: "Pick topics you love and ones you're done with. FeedFlow learns exactly what matters to you.",
    accent: colors.accent,
  },
  {
    emoji: "⚡",
    title: "Activate personalisation",
    body: "FeedFlow runs quietly in the background, engaging with content that matches your interests.",
    accent: colors.success,
  },
  {
    emoji: "📈",
    title: "Watch your feed improve",
    body: "Over time, Instagram's algorithm adapts. Your feed becomes more relevant — every single day.",
    accent: "#FBBF24",
  },
] as const;

function Dot({ active, color }: { active: boolean; color: string }) {
  return (
    <View
      style={{
        width: active ? 20 : 6,
        height: 6,
        borderRadius: radius.full,
        backgroundColor: active ? color : colors.border,
        // transition handled by layout animation via width change
      }}
    />
  );
}

export default function OnboardingWelcome() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const isLast = activeIndex === SLIDES.length - 1;

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setActiveIndex(index);
    },
    [],
  );

  function goNext() {
    if (isLast) {
      router.push("/onboarding/interests");
      return;
    }
    scrollRef.current?.scrollTo({ x: (activeIndex + 1) * SCREEN_WIDTH, animated: true });
  }

  function skip() {
    router.push("/onboarding/interests");
  }

  const currentAccent = SLIDES[activeIndex].accent;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }}>

      {/* Skip button */}
      <View style={{ alignItems: "flex-end", paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        {!isLast && (
          <Pressable onPress={skip} hitSlop={12}>
            <Text size="sm" color="3">Skip</Text>
          </Pressable>
        )}
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View
            key={i}
            style={{
              width: SCREEN_WIDTH,
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: spacing["3xl"],
              gap: spacing["3xl"],
            }}
          >
            {/* Glow + emoji */}
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <View style={{
                width: 120, height: 120,
                borderRadius: radius.full,
                backgroundColor: `${slide.accent}15`,
                borderWidth: 1.5,
                borderColor: `${slide.accent}30`,
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
                shadowColor: slide.accent,
                shadowOpacity: 0.35,
                shadowRadius: 32,
                shadowOffset: { width: 0, height: 0 },
                elevation: 12,
              }}>
                <RNText style={{ fontSize: 52, lineHeight: 64 }}>{slide.emoji}</RNText>
              </View>
            </View>

            {/* Text */}
            <View style={{ alignItems: "center", gap: spacing.lg }}>
              <Text
                size="xl"
                weight="bold"
                style={{ textAlign: "center", color: colors.text1 }}
              >
                {slide.title}
              </Text>
              <Text
                size="base"
                color="2"
                style={{ textAlign: "center", lineHeight: 26 }}
              >
                {slide.body}
              </Text>
            </View>

            {/* Step label */}
            <View style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: radius.full,
              backgroundColor: `${slide.accent}15`,
            }}>
              <Text size="xs" weight="semibold" style={{ color: slide.accent }}>
                Step {i + 1} of {SLIDES.length}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom — dots + CTA */}
      <View style={{
        paddingHorizontal: spacing["2xl"],
        paddingBottom: spacing["3xl"],
        gap: spacing["2xl"],
        alignItems: "center",
      }}>
        {/* Progress dots */}
        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
          {SLIDES.map((_, i) => (
            <Dot key={i} active={i === activeIndex} color={currentAccent} />
          ))}
        </View>

        {/* CTA */}
        <View style={{ width: "100%", gap: spacing.md }}>
          <Pressable
            onPress={goNext}
            accessibilityRole="button"
            accessibilityLabel={isLast ? "Get started" : "Next slide"}
            style={({ pressed }) => ({
              backgroundColor: currentAccent,
              paddingVertical: spacing.lg,
              borderRadius: radius.lg,
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text size="lg" weight="semibold" style={{ color: "#fff" }}>
              {isLast ? "Get Started" : "Next"}
            </Text>
          </Pressable>
        </View>
      </View>

    </SafeAreaView>
  );
}
