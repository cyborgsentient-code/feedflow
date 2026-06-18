import { authService } from "@/services/authService";
import type { AuthError, AuthResult } from "../types";

// Supabase error codes where available, message fallback otherwise.
function mapError(error: { code?: string; message?: string } | null | undefined): AuthError {
  const code = error?.code ?? "";
  const msg = error?.message ?? "";

  if (code === "invalid_credentials" || msg.includes("Invalid login credentials"))
    return { code: "invalid_credentials", message: "Incorrect email or password." };

  if (
    code === "user_already_exists" ||
    msg.includes("User already registered") ||
    msg.includes("already been registered")
  )
    return { code: "email_taken", message: "An account with this email already exists." };

  if (
    code === "over_request_rate_limit" ||
    code === "too_many_requests" ||
    msg.includes("rate limit") ||
    msg.includes("too many requests")
  )
    return { code: "rate_limited", message: "Too many attempts. Please wait a moment." };

  if (
    code === "network_failure" ||
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("NetworkError") ||
    msg.includes("Failed to fetch")
  )
    return { code: "network_error", message: "No connection. Check your internet and try again." };

  return { code: "unknown", message: "Something went wrong. Please try again." };
}

function guardInputs(email: string, password: string): AuthError | null {
  if (!email.trim()) return { code: "unknown", message: "Email is required." };
  if (!password.trim()) return { code: "unknown", message: "Password is required." };
  return null;
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const guard = guardInputs(email, password);
  if (guard) return { success: false, error: guard };

  try {
    const { error } = await authService.signInWithEmail(email, password);
    if (error) return { success: false, error: mapError(error) };
    return { success: true, data: undefined };
  } catch (e: any) {
    return { success: false, error: mapError(e) };
  }
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const guard = guardInputs(email, password);
  if (guard) return { success: false, error: guard };

  try {
    const { error } = await authService.signUpWithEmail(email, password);
    if (error) {
      console.error("[signUp] error:", JSON.stringify(error));
      return { success: false, error: mapError(error) };
    }
    return { success: true, data: undefined };
  } catch (e: any) {
    console.error("[signUp] exception:", e?.message ?? e);
    return { success: false, error: mapError(e) };
  }
}
