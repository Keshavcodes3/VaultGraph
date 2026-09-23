import jwt from "jsonwebtoken";
import type { PublicUser } from "@repo/shared/auth-types";

export type AuthTokenPayload = {
  sub: string;
  email: string;
};

const getJwtSecret = () => {
  const secret = process.env["JWT_SECRET"];
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
