/**
 * Backwards-compatible auth helpers.
 *
 * New code should use `@/lib/api/client` (`api.post(...)`) with the
 * TanStack Query hooks in `@/hooks/auth/*`. This module stays thin so
 * there is exactly one fetch implementation.
 */

import { ApiError, api } from "@/lib/api/client";

export { ApiError as AuthError };

export function postAuth(
  path: "/login" | "/register",
  body: Record<string, string>
): Promise<unknown> {
  return api.post<unknown>(`/api/auth${path}`, body);
}
