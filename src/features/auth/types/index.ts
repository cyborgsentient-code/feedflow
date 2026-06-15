export type AuthError =
  | { code: "invalid_credentials"; message: string }
  | { code: "email_taken"; message: string }
  | { code: "rate_limited"; message: string }
  | { code: "network_error"; message: string }
  | { code: "unknown"; message: string };

export type AuthResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: AuthError };
