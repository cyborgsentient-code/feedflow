import { View } from "react-native";
import { colors, spacing, radius } from "@/constants/theme";

function SkeletonBlock({ width, height, style }: { width: string | number; height: number; style?: object }) {
  return (
    <View
      style={[{
        width,
        height,
        borderRadius: radius.md,
        backgroundColor: colors.elevated,
      }, style]}
    />
  );
}

export function HeroSkeleton() {
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.lg }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ gap: spacing.sm }}>
          <SkeletonBlock width={80} height={10} />
          <SkeletonBlock width={60} height={28} />
        </View>
        <SkeletonBlock width={80} height={28} style={{ borderRadius: radius.full }} />
      </View>
      <View style={{ height: 1, backgroundColor: colors.border }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ gap: spacing.xs }}>
          <SkeletonBlock width={70} height={10} />
          <SkeletonBlock width={90} height={14} />
        </View>
      </View>
    </View>
  );
}

export function FeedSkeleton() {
  return (
    <View>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          <SkeletonBlock width={36} height={36} style={{ borderRadius: radius.md }} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <SkeletonBlock width="50%" height={12} />
            <SkeletonBlock width="35%" height={10} />
          </View>
          <SkeletonBlock width={48} height={10} />
        </View>
      ))}
    </View>
  );
}

export function AnalyticsSkeleton() {
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        {[0, 1].map((i) => (
          <View key={i} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm }}>
            <SkeletonBlock width={28} height={28} />
            <SkeletonBlock width="60%" height={20} />
            <SkeletonBlock width="80%" height={10} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        {[0, 1].map((i) => (
          <View key={i} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm }}>
            <SkeletonBlock width={28} height={28} />
            <SkeletonBlock width="60%" height={20} />
            <SkeletonBlock width="80%" height={10} />
          </View>
        ))}
      </View>
    </View>
  );
}
