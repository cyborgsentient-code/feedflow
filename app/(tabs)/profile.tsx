import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { profileService } from "@/services/profileService";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { colors, spacing, radius } from "@/constants/theme";

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: "success" | "warning" | "1" }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text size="sm" color="3">{label}</Text>
      <Text size="sm" weight="medium" color={valueColor ?? "1"}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => profileService.getProfile(user!.id),
    enabled: !!user,
    staleTime: 60_000,
  });

  const initials = (user?.email?.slice(0, 2) ?? "??").toUpperCase();
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString([], { month: "long", year: "numeric" })
    : "—";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing["5xl"] }}
        showsVerticalScrollIndicator={false}
      >
        <Text size="xl" weight="bold">Profile</Text>

        {/* ── Profile header ── */}
        <View style={{ alignItems: "center", gap: spacing.lg, paddingVertical: spacing.xl }}>
          {/* Avatar */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: radius.full,
            backgroundColor: `${colors.primary}20`,
            borderWidth: 2,
            borderColor: `${colors.primary}40`,
            justifyContent: "center",
            alignItems: "center",
          }}>
            <Text size="xl" weight="bold" color="primary">{initials}</Text>
          </View>

          <View style={{ alignItems: "center", gap: spacing.xs }}>
            <Text size="lg" weight="semibold">
              {profile?.display_name ?? "FeedFlow User"}
            </Text>
            <Text size="sm" color="3">{user?.email ?? "—"}</Text>
          </View>
        </View>

        {/* ── Account section ── */}
        <View style={{ gap: spacing.sm }}>
          <Text size="xs" weight="semibold" color="3" style={{ paddingHorizontal: spacing.xs }}>ACCOUNT</Text>
          <Card variant="bordered" padding="lg">
            <View style={{ gap: spacing.md }}>
              <Row
                label="Onboarding"
                value={profile?.onboarding_complete ? "Complete" : "Pending"}
                valueColor={profile?.onboarding_complete ? "success" : "warning"}
              />
              <Divider />
              <Row label="Member since" value={memberSince} />
            </View>
          </Card>
        </View>

        {/* ── Preferences section ── */}
        <View style={{ gap: spacing.sm }}>
          <Text size="xs" weight="semibold" color="3" style={{ paddingHorizontal: spacing.xs }}>PREFERENCES</Text>
          <Card variant="bordered" padding="lg">
            <View style={{ gap: spacing.md }}>
              <Row label="Theme" value="Dark" />
              <Divider />
              <Row label="Notifications" value="On" />
            </View>
          </Card>
        </View>

        {/* ── Sign out section ── */}
        <View style={{ gap: spacing.sm }}>
          <Text size="xs" weight="semibold" color="3" style={{ paddingHorizontal: spacing.xs }}>SESSION</Text>
          <Button
            label="Sign Out"
            variant="danger"
            size="lg"
            fullWidth
            onPress={signOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out of FeedFlow"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
