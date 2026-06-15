import { supabase } from "@/lib/supabase";
import type { AdminUser } from "../types";

/** Validates that the given userId exists in the admin_users table and returns their role. */
export const sessionValidator = {
  async validate(userId: string): Promise<AdminUser | null> {
    const { data, error } = await supabase
      .from("admin_users")
      .select("id, email, role, created_at")
      .eq("id", userId)
      .single();
    if (error || !data) return null;
    return {
      id:        String(data.id),
      email:     String(data.email),
      role:      data.role as AdminUser["role"],
      createdAt: String(data.created_at),
    };
  },
};
