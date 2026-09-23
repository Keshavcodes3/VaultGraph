import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../../Shared/httpError";
import { authRepository } from "../repositary/auth.repo";
import { verifyAuthToken, type AuthTokenPayload } from "../utils/jwt";

export type AuthRequest = Request & {
  auth?: AuthTokenPayload;
};

export const requireAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization || req?.cookies?.refreshToken;
    console.log(header);
    if (!header?.startsWith("Bearer ")) {
      throw new HttpError("Missing or invalid authorization header", 401);
    }

    const token = header.slice("Bearer ".length).trim();
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
    next(new HttpError("Invalid or expired token", 401));
  }
};
