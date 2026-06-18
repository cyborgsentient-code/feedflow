import { createContext, useContext, useState, type ReactNode } from "react";

export type OnboardingDraft = {
  interests: string[];
  disinterests: string[];
  preferences: Record<string, boolean>;
};

const EMPTY: OnboardingDraft = { interests: [], disinterests: [], preferences: {} };

type OnboardingDraftContext = {
  draft: OnboardingDraft;
  setInterests: (interests: string[]) => void;
  setDisinterests: (disinterests: string[]) => void;
  setPreference: (key: string, value: boolean) => void;
  reset: () => void;
};

const Ctx = createContext<OnboardingDraftContext | null>(null);

export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY);

  return (
    <Ctx.Provider value={{
      draft,
      setInterests:    (interests)    => setDraft((d) => ({ ...d, interests })),
      setDisinterests: (disinterests) => setDraft((d) => ({ ...d, disinterests })),
      setPreference:   (key, value)   => setDraft((d) => ({ ...d, preferences: { ...d.preferences, [key]: value } })),
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
