import { useQuery } from "@tanstack/react-query";
import { ApiError, api, type PublicUser } from "@/lib/api/client";
import { authKeys } from "@/lib/query/query-keys";

/**
 * Current session. `GET /api/auth/me`:
 * - 200 → the user
 * - 401 → `null` (guest). Returned, not thrown, so there is
 *   no error state and no retry loop for logged-out visitors.
 */
export function useCurrentUser() {
  return useQuery<PublicUser | null>({
    queryKey: authKeys.me,
    queryFn: async () => {
      try {
        const { user } = await api.get<{ user: PublicUser }>("/api/auth/me");
        return user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
  });
}
