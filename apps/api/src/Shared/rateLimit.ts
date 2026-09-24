import type { NextFunction, Request, Response } from "express";
import { apiError } from "./apiResponse";

export type RateLimitOptions = {
  /** Sliding window in milliseconds. */
  windowMs: number;
  /** Max requests per key per window. */
  max: number;
  /** Message returned with 429. */
  message?: string;
};

/**
 * Minimal in-memory sliding-window rate limiter for abuse-prone endpoints
 * (invitation creation, resends, token acceptance attempts).
 *
 * Keyed by authenticated user id, falling back to client IP. Single-process
 * memory: sufficient for the current deployment; replace with a shared
 * store if the API ever scales horizontally.
 */
export const createRateLimiter = (options: RateLimitOptions) => {
  const hits = new Map<string, number[]>();

  // Avoid unbounded growth: opportunistically purge expired buckets.
  const purge = () => {
    if (hits.size < 5000) return;
    const cutoff = Date.now() - options.windowMs;
    for (const [key, stamps] of hits) {
      const fresh = stamps.filter((t) => t > cutoff);
      if (fresh.length === 0) hits.delete(key);
      else hits.set(key, fresh);
    }
  };

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as Request & { user?: { id?: string } }).user?.id;
    const key =
      userId ??
      req.ip ??
      req.socket?.remoteAddress ??
      "anonymous";

    const now = Date.now();
    const cutoff = now - options.windowMs;
    const stamps = (hits.get(key) ?? []).filter((t) => t > cutoff);

    if (stamps.length >= options.max) {
      return apiError(
        res,
        options.message ?? "Too many requests. Please try again later.",
        429
      );
    }

    stamps.push(now);
    hits.set(key, stamps);
    purge();
    next();
  };
};

/** 20 invitation operations per 10 minutes per user (creation). */
export const invitationCreateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "Too many invitations. Please wait a few minutes and try again.",
});

/** 5 resends per 10 minutes per user (resend spam guard). */
export const invitationResendLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many resends. Please wait a few minutes and try again.",
});

/** 30 token attempts per 10 minutes per user/IP (token abuse guard). */
export const invitationTokenLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: "Too many attempts. Please wait a few minutes and try again.",
});
