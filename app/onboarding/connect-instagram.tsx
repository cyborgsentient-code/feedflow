import { useState, useEffect } from "react";
import { View, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { colors, spacing, radius } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import type { ConnectionStatus } from "@/types/database";

const AUTOMATION_SERVER = process.env.EXPO_PUBLIC_AUTOMATION_SERVER_URL!;
const API_SECRET = process.env.EXPO_PUBLIC_AUTOMATION_API_SECRET!;

export default function ConnectInstagram() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [igUsername, setIgUsername] = useState("");
  const [igPassword, setIgPassword] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("instagram_connections")
      .select("status, instagram_username")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setStatus(data.status as ConnectionStatus);
          setUsername(data.instagram_username);
        }
        setLoading(false);
      });

    // Realtime updates from automation server
    const channel = supabase
      .channel(`ig:${user.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public",
        table: "instagram_connections",
        filter: `user_id=eq.${user.id}`,
      }, (payload: any) => {
        setStatus(payload.new.status);
        setUsername(payload.new.instagram_username);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  async function handleConnect() {
    if (!user || !igUsername.trim() || !igPassword.trim()) {
      setError("Please enter your Instagram username and password.");
      return;
    }
    setError(null);
    setStatus("connecting");

    try {
      const url = `${AUTOMATION_SERVER}/connect`;
      console.log("[connect] POST", url);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-secret": API_SECRET,
        },
        body: JSON.stringify({
          userId: user.id,
          username: igUsername.trim().toLowerCase(),
          password: igPassword,
        }),
      });

      console.log("[connect] status", res.status);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setShowForm(false);
    } catch (e) {
      console.error("[connect] error:", e instanceof Error ? e.message : e);
      setStatus("failed");
      setError(e instanceof Error ? e.message : "Connection failed.");
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.base, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const isConnecting = status === "connecting";
  const isConnected  = status === "connected";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.base }}>
      <View style={{ flex: 1, padding: spacing["2xl"], gap: spacing["3xl"], justifyContent: "center" }}>

        {/* Header */}
        <View style={{ alignItems: "center", gap: spacing.lg }}>
          <View style={{
            width: 80, height: 80, borderRadius: 22,
            alignItems: "center", justifyContent: "center",
            backgroundColor: "#C13584",
            shadowColor: "#E1306C", shadowOpacity: 0.5, shadowRadius: 16, elevation: 8,
          }}>
            <Text style={{ fontSize: 36 }}>📷</Text>
          </View>
          <View style={{ alignItems: "center", gap: spacing.sm }}>
            <Text size="2xl" weight="bold" style={{ textAlign: "center" }}>Connect Instagram</Text>
            <Text size="base" color="2" style={{ textAlign: "center", lineHeight: 24 }}>
              FeedFlow will engage with content aligned to your interests to improve what shows up in your feed.
            </Text>
          </View>
        </View>

        {/* Status card */}
        <Card variant="bordered" padding="lg">
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            {isConnecting
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <View style={{
                  width: 10, height: 10, borderRadius: radius.full,
                  backgroundColor:
                    isConnected ? colors.success :
                    status === "failed" ? colors.error : colors.text3,
                }} />
            }
            <View style={{ flex: 1 }}>
              <Text size="sm" weight="semibold">
                {status === "disconnected" && "Not connected"}
                {status === "connecting"   && "Connecting to Instagram…"}
                {status === "connected"    && (username ? `@${username}` : "Instagram connected")}
                {status === "failed"       && "Connection failed"}
              </Text>
              {error && <Text size="xs" color="error">{error}</Text>}
            </View>
            {isConnected && <Text size="lg">✅</Text>}
          </View>
        </Card>

        {/* Credential form */}
        {(showForm || (!isConnected && !isConnecting)) && !isConnected && (
          <View style={{ gap: spacing.md }}>
            <TextInput
              placeholder="Instagram username"
              placeholderTextColor={colors.text3}
              value={igUsername}
              onChangeText={setIgUsername}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                backgroundColor: colors.elevated,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                color: colors.text1,
                fontSize: 15,
              }}
            />
            <TextInput
              placeholder="Instagram password"
              placeholderTextColor={colors.text3}
              value={igPassword}
              onChangeText={setIgPassword}
              secureTextEntry
              style={{
                backgroundColor: colors.elevated,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                color: colors.text1,
                fontSize: 15,
              }}
            />
          </View>
        )}

        {/* Actions */}
        <View style={{ gap: spacing.md }}>
          {!isConnected ? (
            <Button
              label={isConnecting ? "Connecting…" : status === "failed" ? "Retry Connection" : "Connect Instagram"}
              size="lg"
              fullWidth
              disabled={isConnecting}
              onPress={handleConnect}
              accessibilityRole="button"
            />
          ) : (
            <Button
              label="Continue"
              size="lg"
              fullWidth
              onPress={() => router.push("/onboarding/preferences")}
              accessibilityRole="button"
            />
          )}
          {(status === "disconnected" || status === "failed") && (
            <Button
              label="Skip for now"
              variant="ghost"
              size="lg"
              fullWidth
              onPress={() => router.push("/onboarding/preferences")}
              accessibilityRole="button"
            />
          )}
        </View>

      </View>
    </SafeAreaView>
  );
}
