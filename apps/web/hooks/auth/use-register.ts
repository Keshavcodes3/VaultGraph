import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type AuthResult } from "@/lib/api/client";
import { authKeys } from "@/lib/query/query-keys";

export type RegisterInput = {
  username: string;
  email: string;
  password: string;
};

/**
 * Registration mutation. Mirrors the API's `registerSchema`
 * (`username`, `email`, `password`). Seeds `["auth", "me"]` on success.
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterInput) =>
      api.post<AuthResult>("/api/auth/register", input),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}
