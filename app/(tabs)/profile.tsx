import { useState } from "react";
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { profileService } from "@/services/profileService";
import { profileWriteService } from "@/services/profile/profileWriteService";
import { supabase } from "@/lib/supabase";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { colors, spacing, radius } from "@/constants/theme";
import { INTERESTS } from "@/features/onboarding/constants/interests";

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

function formatSync(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function InterestEditor({
  current, disinterests, onSave, onCancel, saving,
}: {
  current: string[];
  disinterests: string[];
  onSave: (interests: string[], disinterests: string[]) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(current);
  const [reduced, setReduced] = useState<string[]>(disinterests);

  function toggle(slug: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(slug) ? list.filter(s => s !== slug) : [...list, slug]);
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <Text size="sm" weight="semibold" color="2">See more of</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {INTERESTS.map(item => {
          const active = selected.includes(item.slug);
          return (
            <Pressable key={item.slug} onPress={() => toggle(item.slug, selected, setSelected)}
              style={{
                paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
                borderRadius: radius.full, borderWidth: 1.5,
                flexDirection: "row", alignItems: "center", gap: spacing.xs,
                backgroundColor: active ? `${colors.primary}20` : colors.elevated,
                borderColor: active ? colors.primary : colors.border,
              }}>
              <Text style={{ fontSize: 12 }}>{item.emoji}</Text>
              <Text size="xs" weight="medium" style={{ color: active ? colors.primary : colors.text2 }}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text size="sm" weight="semibold" color="2">See less of</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {INTERESTS.map(item => {
          const active = reduced.includes(item.slug);
          return (
            <Pressable key={item.slug} onPress={() => toggle(item.slug, reduced, setReduced)}
              style={{
                paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
                borderRadius: radius.full, borderWidth: 1.5,
                flexDirection: "row", alignItems: "center", gap: spacing.xs,
                backgroundColor: active ? `${colors.warning}20` : colors.elevated,
                borderColor: active ? colors.warning : colors.border,
              }}>
              <Text style={{ fontSize: 12 }}>{item.emoji}</Text>
              <Text size="xs" weight="medium" style={{ color: active ? colors.warning : colors.text2 }}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <Button label="Cancel" variant="ghost" size="md" onPress={onCancel} style={{ flex: 1 }} />
        <Button
          label={saving ? "Saving…" : "Save"}
          size="md"
          disabled={saving || selected.length < 3}
          onPress={() => onSave(selected, reduced)}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const qc = useQueryClient();
  const [editingInterests, setEditingInterests] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => profileService.getProfile(user!.id),
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: igConn } = useQuery({
    queryKey: ["ig_conn", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("instagram_connections")
        .select("instagram_username, status, updated_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const saveInterests = useMutation({
    mutationFn: async ({ interests, disinterests }: { interests: string[]; disinterests: string[] }) => {
      await profileWriteService.updateProfile(user!.id, { interests, disinterests });
      await profileWriteService.saveInterestPreferences(user!.id, interests);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      setEditingInterests(false);
    },
  });

  const initials = (user?.email?.slice(0, 2) ?? "??").toUpperCase();
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString([], { month: "long", year: "numeric" })
    : "—";
  const currentInterests: string[] = profile?.interests ?? [];
  const currentDisinterests: string[] = (profile as any)?.disinterests ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing["5xl"] }}
        showsVerticalScrollIndicator={false}
      >
        <Text size="xl" weight="bold">Profile</Text>

        {/* Avatar */}
        <View style={{ alignItems: "center", gap: spacing.lg, paddingVertical: spacing.xl }}>
          <View style={{
            width: 80, height: 80, borderRadius: radius.full,
            backgroundColor: `${colors.primary}20`, borderWidth: 2, borderColor: `${colors.primary}40`,
            justifyContent: "center", alignItems: "center",
          }}>
            <Text size="xl" weight="bold" color="primary">{initials}</Text>
          </View>
          <View style={{ alignItems: "center", gap: spacing.xs }}>
            <Text size="lg" weight="semibold">{profile?.display_name ?? "FeedFlow User"}</Text>
            <Text size="sm" color="3">{user?.email ?? "—"}</Text>
          </View>
        </View>

        {/* Account */}
        <View style={{ gap: spacing.sm }}>
          <Text size="xs" weight="semibold" color="3" style={{ paddingHorizontal: spacing.xs }}>ACCOUNT</Text>
          <Card variant="bordered" padding="lg">
            <View style={{ gap: spacing.md }}>
              <Row label="Onboarding" value={profile?.onboarding_complete ? "Complete" : "Pending"} valueColor={profile?.onboarding_complete ? "success" : "warning"} />
              <Divider />
              <Row label="Member since" value={memberSince} />
            </View>
          </Card>
        </View>

        {/* Instagram Connection */}
        <View style={{ gap: spacing.sm }}>
          <Text size="xs" weight="semibold" color="3" style={{ paddingHorizontal: spacing.xs }}>INSTAGRAM</Text>
          <Card variant="bordered" padding="lg">
            <View style={{ gap: spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <View style={{
                  width: 10, height: 10, borderRadius: radius.full,
                  backgroundColor: igConn?.status === "connected" ? colors.success : colors.text3,
                }} />
                <View style={{ flex: 1 }}>
                  <Text size="sm" weight="semibold">
                    {igConn?.instagram_username ? `@${igConn.instagram_username}` : "Not connected"}
                  </Text>
                  <Text size="xs" color="3">
                    {igConn?.status === "connected" ? "Automation active" : "Connect to start personalisation"}
                  </Text>
                </View>
                {igConn?.status === "connected" && <Text>✅</Text>}
              </View>
              <Divider />
              <Row label="Last sync" value={formatSync(igConn?.updated_at)} />
              <Row
                label="Status"
                value={igConn?.status === "connected" ? "Connected" : igConn?.status ?? "Disconnected"}
                valueColor={igConn?.status === "connected" ? "success" : "warning"}
              />
            </View>
          </Card>
        </View>

        {/* Content Preferences */}
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.xs }}>
            <Text size="xs" weight="semibold" color="3">CONTENT PREFERENCES</Text>
            {!editingInterests && (
              <Pressable onPress={() => setEditingInterests(true)}>
                <Text size="xs" color="primary" weight="semibold">Edit</Text>
              </Pressable>
            )}
          </View>
          <Card variant="bordered" padding="lg">
            {editingInterests ? (
              <InterestEditor
                current={currentInterests}
                disinterests={currentDisinterests}
                saving={saveInterests.isPending}
                onCancel={() => setEditingInterests(false)}
                onSave={(interests, disinterests) => saveInterests.mutate({ interests, disinterests })}
              />
            ) : (
              <View style={{ gap: spacing.md }}>
                <View style={{ gap: spacing.sm }}>
                  <Text size="xs" color="3">SEEING MORE OF</Text>
                  {currentInterests.length === 0 ? (
                    <Text size="sm" color="3">None selected</Text>
                  ) : (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                      {currentInterests.map(slug => {
                        const item = INTERESTS.find(i => i.slug === slug);
                        return (
                          <View key={slug} style={{
                            paddingHorizontal: spacing.sm, paddingVertical: 3,
                            borderRadius: radius.full, backgroundColor: `${colors.primary}20`,
                            flexDirection: "row", alignItems: "center", gap: 4,
                          }}>
                            <Text style={{ fontSize: 11 }}>{item?.emoji ?? "📌"}</Text>
                            <Text size="xs" style={{ color: colors.primary }}>{item?.label ?? slug}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
                {currentDisinterests.length > 0 && (
                  <>
                    <Divider />
                    <View style={{ gap: spacing.sm }}>
                      <Text size="xs" color="3">REDUCING</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                        {currentDisinterests.map(slug => {
                          const item = INTERESTS.find(i => i.slug === slug);
                          return (
                            <View key={slug} style={{
                              paddingHorizontal: spacing.sm, paddingVertical: 3,
                              borderRadius: radius.full, backgroundColor: `${colors.warning}20`,
                              flexDirection: "row", alignItems: "center", gap: 4,
                            }}>
                              <Text style={{ fontSize: 11 }}>{item?.emoji ?? "📌"}</Text>
                              <Text size="xs" style={{ color: colors.warning }}>{item?.label ?? slug}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </>
                )}
              </View>
            )}
          </Card>
        </View>

        {/* Privacy */}
        <View style={{ gap: spacing.sm }}>
          <Text size="xs" weight="semibold" color="3" style={{ paddingHorizontal: spacing.xs }}>PRIVACY</Text>
          <Card variant="bordered" padding="lg">
            <View style={{ gap: spacing.md }}>
              <Row label="Data storage" value="Supabase (encrypted)" />
              <Divider />
              <Row label="Automation logs" value="Stored 90 days" />
              <Divider />
              <Row label="Password storage" value="Encrypted at rest" />
            </View>
          </Card>
        </View>

        {/* Session */}
        <View style={{ gap: spacing.sm }}>
          <Text size="xs" weight="semibold" color="3" style={{ paddingHorizontal: spacing.xs }}>SESSION</Text>
          <Button
            label="Sign Out" variant="danger" size="lg" fullWidth
            onPress={async () => { await signOut(); router.replace("/sign-in"); }}
            accessibilityRole="button"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
