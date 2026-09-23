import jwt from "jsonwebtoken";
import type { Request } from "express";
import type { PublicUser } from "@repo/shared/auth-types";

export type AuthTokenPayload = {
  sub: string;
  email: string;
};

/**
 * Pull a JWT from the Authorization header first, then fall back to cookies.
 * Strips a "Bearer " prefix and surrounding quotes/whitespace so tokens
 * copy-pasted from login responses or stored with prefixes still verify.
 */
export const extractAuthToken = (req: Request): string | undefined => {
  const header = req.headers.authorization;
  const fromHeader =
    typeof header === "string" && header.trim().length > 0
      ? header.trim()
      : undefined;

  const cookies = (req as Request & { cookies?: Record<string, unknown> })
    .cookies;
  const fromCookie =
    (cookies?.["accessToken"] as string | undefined) ??
    (cookies?.["refreshToken"] as string | undefined) ??
    (cookies?.["token"] as string | undefined);

  let token =
    fromHeader ?? (typeof fromCookie === "string" ? fromCookie : undefined);
  if (!token) return undefined;

  token = token.trim();
  // Strip "Bearer " prefix if the cookie/header value includes it.
  if (/^bearer\s+/i.test(token)) {
    token = token.replace(/^bearer\s+/i, "").trim();
  }
  // Strip surrounding quotes (common when copy-pasting JSON string values).
  if (
    token.length >= 2 &&
    ((token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'")))
  ) {
    token = token.slice(1, -1).trim();
  }
  return token || undefined;
};

const getJwtSecret = () => {
  let secret = process.env["JWT_SECRET"];
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Add it to your .env file.");
  }
  // Guard against accidental whitespace/quotes from copy-pasted .env values.
  // dotenv strips quotes, but a system-level env var may include them.
  secret = secret.trim();
  if (
    secret.length >= 2 &&
    ((secret.startsWith('"') && secret.endsWith('"')) ||
      (secret.startsWith("'") && secret.endsWith("'")))
  ) {
    secret = secret.slice(1, -1).trim();
  }
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Add it to your .env file.");
  }
  return secret;
};

const getJwtExpiresIn = (): string => {
  return process.env["JWT_EXPIRES_IN"] ?? "7d";
};

export const signAuthToken = (user: Pick<PublicUser, "id" | "email">) => {
  const payload: AuthTokenPayload = { sub: user.id, email: user.email };
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiresIn() as jwt.SignOptions["expiresIn"],
  });
};

export const verifyAuthToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
};
