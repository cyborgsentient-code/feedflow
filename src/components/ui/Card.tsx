import React from "react";
import { View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  variant?: "default" | "elevated" | "bordered";
  padding?: "sm" | "md" | "lg" | "none";
}

const variantClasses = {
  default:  "bg-surface rounded-2xl",
  elevated: "bg-elevated rounded-2xl",
  bordered: "bg-surface rounded-2xl border border-border",
};

const paddingClasses = {
  none: "",
  sm:   "p-3",
  md:   "p-4",
  lg:   "p-5",
};

export function Card({
  variant = "default",
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <View
      className={`${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
