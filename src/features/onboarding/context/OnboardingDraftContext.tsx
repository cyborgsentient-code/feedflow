import { createContext, useContext, useState, type ReactNode } from "react";

export type OnboardingDraft = {
  interests: string[];
  preferences: Record<string, boolean>;
};

const EMPTY: OnboardingDraft = { interests: [], preferences: {} };

type OnboardingDraftContext = {
  draft: OnboardingDraft;
  setInterests: (interests: string[]) => void;
  setPreference: (key: string, value: boolean) => void;
  reset: () => void;
};

const Ctx = createContext<OnboardingDraftContext | null>(null);

export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY);

  return (
    <Ctx.Provider value={{
      draft,
      setInterests: (interests) => setDraft((d) => ({ ...d, interests })),
      setPreference: (key, value) => setDraft((d) => ({ ...d, preferences: { ...d.preferences, [key]: value } })),
      reset: () => setDraft(EMPTY),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useOnboardingDraft(): OnboardingDraftContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOnboardingDraft must be used inside OnboardingDraftProvider");
  return ctx;
}
