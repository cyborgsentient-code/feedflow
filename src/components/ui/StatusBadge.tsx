import React from "react";
import { View } from "react-native";
import { Text } from "./Text";

type Status = "active" | "paused" | "connecting" | "failed" | "disconnected";

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

const config: Record<Status, { dot: string; bg: string; text: string; defaultLabel: string }> = {
  active:       { dot: "bg-success",  bg: "bg-success/10",  text: "text-success", defaultLabel: "Active" },
  paused:       { dot: "bg-warning",  bg: "bg-warning/10",  text: "text-warning", defaultLabel: "Paused" },
  connecting:   { dot: "bg-primary",  bg: "bg-primary/10",  text: "text-primary", defaultLabel: "Connecting" },
  failed:       { dot: "bg-error",    bg: "bg-error/10",    text: "text-error",   defaultLabel: "Failed" },
  disconnected: { dot: "bg-text-3",   bg: "bg-elevated",    text: "text-text-2",  defaultLabel: "Disconnected" },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const c = config[status];
  return (
    <View className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full ${c.bg}`}>
      <View className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <Text size="xs" weight="medium" className={c.text}>
        {label ?? c.defaultLabel}
      </Text>
    </View>
  );
}
