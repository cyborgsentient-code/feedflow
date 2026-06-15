/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        base:        "#0A0A0F",
        surface:     "#13131A",
        elevated:    "#1C1C27",
        border:      "#2A2A3A",
        primary:     "#6C63FF",
        "primary-light": "#9B8EFF",
        accent:      "#FF6584",
        success:     "#4ADE80",
        warning:     "#FBBF24",
        error:       "#F87171",
        "text-1":    "#F1F1F5",
        "text-2":    "#8B8BA7",
        "text-3":    "#5C5C7A",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
