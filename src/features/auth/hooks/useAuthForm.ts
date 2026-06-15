import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, signUp } from "../services/authFormService";
import { signInSchema, signUpSchema, type SignInValues, type SignUpValues } from "../validators";
import type { AuthError } from "../types";

const RATE_LIMIT_COOLDOWN = 15; // seconds

function useCooldown() {
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setCountdown(RATE_LIMIT_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return { countdown, isCooling: countdown > 0, start };
}

function sanitize(values: SignInValues): SignInValues {
  return {
    email: values.email.trim().toLowerCase(),
    password: values.password,
  };
}

function sanitizeSignUp(values: SignUpValues): SignUpValues {
  return {
    ...values,
    email: values.email.trim().toLowerCase(),
  };
}

export function useSignInForm() {
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const { countdown, isCooling, start: startCooldown } = useCooldown();
  const inFlightRef = useRef(false);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (raw) => {
    if (inFlightRef.current || isCooling) return;
    inFlightRef.current = true;
    setAuthError(null);

    const { email, password } = sanitize(raw);
    const result = await signIn(email, password);

    inFlightRef.current = false;

    if (!result.success) {
      setAuthError(result.error);
      if (result.error.code === "rate_limited") startCooldown();
    }
    // On success, _layout.tsx onAuthStateChange drives navigation
  });

  return {
    form,
    onSubmit,
    authError,
    countdown,
    isDisabled: form.formState.isSubmitting || isCooling,
  };
}

export function useSignUpForm() {
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const { countdown, isCooling, start: startCooldown } = useCooldown();
  const inFlightRef = useRef(false);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(async (raw) => {
    if (inFlightRef.current || isCooling) return;
    inFlightRef.current = true;
    setAuthError(null);

    const { email, password } = sanitizeSignUp(raw);
    const result = await signUp(email, password);

    inFlightRef.current = false;

    if (!result.success) {
      setAuthError(result.error);
      if (result.error.code === "rate_limited") startCooldown();
    }
    // On success, _layout.tsx onAuthStateChange drives navigation (same as sign-in)
  });

  return {
    form,
    onSubmit,
    authError,
    emailSent: false,
    countdown,
    isDisabled: form.formState.isSubmitting || isCooling,
  };
}
