import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type AuthResult } from "@/lib/api/client";
import { authKeys } from "@/lib/query/query-keys";

export type LoginInput = {
  email: string;
  password: string;
};

/**
 * Login mutation. On success the authenticated user is seeded
 * straight into the `["auth", "me"]` cache — no extra `/me` round-trip.
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => api.post<AuthResult>("/api/auth/login", input),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}
