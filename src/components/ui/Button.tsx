import React from "react";
import { TouchableOpacity, ActivityIndicator, type TouchableOpacityProps } from "react-native";
import { Text } from "./Text";
import { colors } from "@/constants/theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  label: string;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:   "bg-primary",
  secondary: "bg-elevated border border-border",
  ghost:     "bg-transparent",
  danger:    "bg-error/20 border border-error/40",
};

const labelStyles: Record<Variant, string> = {
  primary:   "text-white font-semibold",
  secondary: "text-text-1 font-medium",
  ghost:     "text-text-2 font-medium",
  danger:    "text-error font-medium",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-4 py-2 rounded-xl",
  md: "px-5 py-3.5 rounded-xl",
  lg: "px-6 py-4 rounded-2xl",
};

const textSizes: Record<Size, "sm" | "base" | "lg"> = {
  sm: "sm", md: "base", lg: "lg",
};

export function Button({
  variant = "primary", size = "md", loading = false,
  label, fullWidth = false, disabled, onPress, ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      className={[
        "items-center justify-center flex-row gap-2",
        variantStyles[variant], sizeStyles[size],
        fullWidth && "w-full",
        isDisabled && "opacity-50",
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {loading
        ? <ActivityIndicator size="small" color={variant === "primary" ? colors.text1 : colors.primary} />
        : <Text size={textSizes[size]} className={labelStyles[variant]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}
