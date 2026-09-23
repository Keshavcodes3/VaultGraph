/**
 * Small fetch-based API client for VaultGraph.
 *
 * - Single centralized base URL (env-first, one local fallback).
 * - `credentials: "include"` so the httpOnly auth cookie travels.
 * - The JWT is never read or stored in JavaScript; the cookie is the session.
 * - Typed `{ success, message, data }` envelope handling, no `any`.
 */

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getApiBaseUrl(): string {
  return process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";
}

type Envelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(
      "Can't reach your workspace right now. Check your connection and try again.",
      0
    );
  }

  let json: Envelope<T> | null = null;
  try {
    json = (await res.json()) as Envelope<T>;
  } catch {
    json = null;
  }

  if (!res.ok || !json || json.success !== true) {
    throw new ApiError(
      json?.message ?? "Something went wrong. Please try again.",
      res.status
    );
  }

  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body: Record<string, string>) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};

/** Mirror of the API's public user shape (dates arrive as ISO strings). */
export type PublicUser = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

/** What register/login return: the user plus a token the client ignores. */
export type AuthResult = {
  user: PublicUser;
  token: string;
};
