import type { AIServiceError } from "../types";

export function mapAIError(e: unknown): AIServiceError {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("not found") || msg.includes("PGRST116"))
    return { code: "job_not_found",     message: "AI job not found." };
  if (msg.includes("23505") || msg.includes("unique") || msg.includes("duplicate"))
    return { code: "duplicate_job",     message: "AI job already exists." };
  if (msg.includes("invalid") || msg.includes("validation"))
    return { code: "validation_failed", message: "Invalid task payload." };
  if (msg.includes("fetch") || msg.includes("network"))
    return { code: "network_error",     message: "No connection." };
  if (msg.includes("PGRST") || msg.includes("relation"))
    return { code: "db_error",          message: "Database error." };
  return { code: "unknown", message: "Something went wrong. Please try again." };
}
