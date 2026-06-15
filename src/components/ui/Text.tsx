import React from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";

type Size = "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
type Weight = "regular" | "medium" | "semibold" | "bold";

interface TextProps extends RNTextProps {
  size?: Size;
  weight?: Weight;
  color?: "1" | "2" | "3" | "primary" | "accent" | "success" | "error" | "warning";
}

const sizeClasses: Record<Size, string> = {
  "xs":   "text-[11px]",
  "sm":   "text-[13px]",
  "base": "text-base",
  "lg":   "text-xl",
  "xl":   "text-2xl",
  "2xl":  "text-[32px]",
};

const weightClasses: Record<Weight, string> = {
  regular:  "font-normal",
  medium:   "font-medium",
  semibold: "font-semibold",
  bold:     "font-bold",
};

const colorClasses: Record<string, string> = {
  "1":      "text-text-1",
  "2":      "text-text-2",
  "3":      "text-text-3",
  primary:  "text-primary",
  accent:   "text-accent",
  success:  "text-success",
  error:    "text-error",
  warning:  "text-warning",
};

export function Text({
  size = "base",
  weight = "regular",
  color = "1",
  className = "",
  children,
  ...props
}: TextProps) {
  return (
    <RNText
      className={`${sizeClasses[size]} ${weightClasses[weight]} ${colorClasses[color]} ${className}`}
      {...props}
    >
      {children}
    </RNText>
  );
}
