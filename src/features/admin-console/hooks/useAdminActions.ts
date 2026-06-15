import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { adminCommandRouter } from "../services/adminCommandRouter";
import type { AdminAction } from "../types";

export function useAdminActions() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (action: AdminAction) =>
      adminCommandRouter.execute({ ...action, adminId: action.adminId || user!.id }),
    onSuccess: () => {
      // Invalidate all admin views after any action
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      qc.invalidateQueries({ queryKey: ["admin-traces"] });
    },
  });

  return {
    execute:  mutation.mutate,
    pending:  mutation.isPending,
    result:   mutation.data,
    error:    mutation.error,
  };
}
