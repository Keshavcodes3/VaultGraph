import type { Request, Response, NextFunction } from "express";
import {
  extractAuthToken,
  verifyAuthToken,
} from "../Modules/auth/utils/jwt";

interface AuthPayload {
  id: string;
}

declare global {
  namespace Express {
    interface Request {
      user: AuthPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractAuthToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Tokens are signed as { sub, email } (see signAuthToken). Accept the
    // legacy { id } shape too so old tokens/clients keep working.
    const decoded = verifyAuthToken(token) as unknown as {
      sub?: string;
      id?: string;
    };
    const userId = decoded.sub ?? decoded.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    req.user = {
      id: userId,
    };

    next();
  } catch (err) {
    console.error(
      "Authentication failed:",
      err instanceof Error ? err.message : err
    );
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
