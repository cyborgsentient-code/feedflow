// Central theme constants — matches tailwind.config.js exactly.
// Use these in JS contexts (StyleSheet, Reanimated, etc.)

export const colors = {
  base:         "#0A0A0F",
  surface:      "#13131A",
  elevated:     "#1C1C27",
  border:       "#2A2A3A",
  primary:      "#6C63FF",
  primaryLight: "#9B8EFF",
  accent:       "#FF6584",
  success:      "#4ADE80",
  warning:      "#FBBF24",
  error:        "#F87171",
  text1:        "#F1F1F5",
  text2:        "#8B8BA7",
  text3:        "#5C5C7A",
} as const;

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;

export const fontSize = {
  xs:   11,
  sm:   13,
  base: 16,
  lg:   20,
  xl:   24,
  "2xl": 32,
} as const;

export const fontWeight = {
  regular: "400" as const,
  medium:  "500" as const,
  semibold:"600" as const,
  bold:    "700" as const,
};
