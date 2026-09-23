import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../../Shared/httpError";
import { authRepository } from "../repositary/auth.repo";
import {
  extractAuthToken,
  verifyAuthToken,
  type AuthTokenPayload,
} from "../utils/jwt";

export type AuthRequest = Request & {
  auth?: AuthTokenPayload;
};

// Re-exported for backwards compatibility (e.g. workspace middleware).
export { extractAuthToken };

export const requireAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = extractAuthToken(req);

    if (!token) {
      throw new HttpError("Missing auth token", 401);
    }

    const payload = verifyAuthToken(token);

    // Ensure the user still exists (e.g. deleted after token issuance).
    const user = await authRepository.findById(payload.sub);
    if (!user) {
      throw new HttpError("User not found", 401);
    }

    req.auth = { sub: user.id, email: user.email };
    next();
  } catch (err) {
    if (err instanceof HttpError) {
      next(err);
      return;
    }
    // Log a concise message instead of the full JsonWebTokenError dump.
    console.error(
      "Authentication failed:",
      err instanceof Error ? err.message : err
    );
    next(new HttpError("Invalid or expired token", 401));
  }
};
