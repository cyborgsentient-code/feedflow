import type { OnboardingInterest } from "../types";

export const INTERESTS: OnboardingInterest[] = [
  { slug: "technology",    label: "Technology",    emoji: "💻" },
  { slug: "design",        label: "Design",        emoji: "🎨" },
  { slug: "fitness",       label: "Fitness",       emoji: "💪" },
  { slug: "food",          label: "Food",          emoji: "🍜" },
  { slug: "travel",        label: "Travel",        emoji: "✈️" },
  { slug: "music",         label: "Music",         emoji: "🎵" },
  { slug: "photography",   label: "Photography",   emoji: "📷" },
  { slug: "gaming",        label: "Gaming",        emoji: "🎮" },
  { slug: "business",      label: "Business",      emoji: "📈" },
  { slug: "art",           label: "Art",           emoji: "🖼️" },
  { slug: "science",       label: "Science",       emoji: "🔬" },
  { slug: "fashion",       label: "Fashion",       emoji: "👗" },
];

export const MIN_INTERESTS = 3;
export const MAX_INTERESTS = 5;
